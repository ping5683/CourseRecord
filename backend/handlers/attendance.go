package handlers

import (
	"fmt"
	"net/http"
	"strconv"
	"time"
	"course-management-backend/database"
	"course-management-backend/models"
	"course-management-backend/utils"

	"github.com/gin-gonic/gin"
)

// GetUpcomingCourses 获取即将开始的课程
func GetUpcomingCourses(c *gin.Context) {
	userID := c.GetUint("userID")
	days, _ := strconv.Atoi(c.DefaultQuery("days", "1"))

	db := database.GetDB()
	today := time.Now()
	_ = today.AddDate(0, 0, days) // 临时变量，用于扩展功能

	var courses []models.Course
	err := db.Where("user_id = ? AND is_active = ?", userID, true).
		Preload("Schedules", "is_active = ?", true).
		Find(&courses).Error

	if err != nil {
		utils.Error(c, http.StatusInternalServerError, "查询课程失败")
		return
	}

	var upcomingCourses []gin.H
	for _, course := range courses {
		for _, schedule := range course.Schedules {
			// 计算未来几天内的上课日期
			for d := 0; d <= days; d++ {
				currentDate := today.AddDate(0, 0, d)
				weekday := int(currentDate.Weekday())
				if weekday == 0 {
					weekday = 7 // 周日转换为7
				}

				if weekday == schedule.Weekday {
					// 检查是否已经有出勤记录
					var existingAttendance models.AttendanceRecord
					db.Where("course_id = ? AND schedule_date = ?", course.ID, currentDate.Format("2006-01-02")).
						First(&existingAttendance)

					upcomingCourses = append(upcomingCourses, gin.H{
						"courseId":     course.ID,
						"courseName":   course.Name,
						"scheduleDate": currentDate.Format("2006-01-02"),
						"weekday":      schedule.Weekday,
						"startTime":    schedule.StartTime,
						"endTime":      schedule.EndTime,
						"location":     schedule.Location,
						"instructor":   schedule.Instructor,
						"hasAttendance": existingAttendance.ID > 0,
					})
				}
			}
		}
	}

	utils.Success(c, "获取成功", upcomingCourses)
}

// CreateAttendance 创建出勤记录
func CreateAttendance(c *gin.Context) {
	userID := c.GetUint("userID")

	var req struct {
		CourseID     uint   `json:"courseId" binding:"required"`
		ScheduleDate string `json:"scheduleDate" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationError(c, err.Error())
		return
	}

	db := database.GetDB()

	// 验证课程是否存在且属于当前用户
	var course models.Course
	if err := db.Where("id = ? AND user_id = ?", req.CourseID, userID).First(&course).Error; err != nil {
		utils.Error(c, http.StatusNotFound, "课程不存在")
		return
	}

	// 检查是否已有出勤记录
	var existingAttendance models.AttendanceRecord
	if err := db.Where("course_id = ? AND schedule_date = ?", req.CourseID, req.ScheduleDate).
		First(&existingAttendance).Error; err == nil {
		utils.Error(c, http.StatusBadRequest, "该日期已有出勤记录")
		return
	}

	// 创建出勤记录
	attendance := models.AttendanceRecord{
		CourseID:     req.CourseID,
		ScheduleDate: req.ScheduleDate,
		Status:       "pending",
	}

	if err := db.Create(&attendance).Error; err != nil {
		utils.Error(c, http.StatusInternalServerError, "创建出勤记录失败")
		return
	}

	utils.Success(c, "创建成功", attendance)
}

// UpdateAttendance 更新出勤状态
func UpdateAttendance(c *gin.Context) {
	userID := c.GetUint("userID")
	attendanceID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		utils.Error(c, http.StatusBadRequest, "无效的出勤记录ID")
		return
	}

	var req models.AttendanceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationError(c, err.Error())
		return
	}

	db := database.GetDB()

	// 查找出勤记录
	var attendance models.AttendanceRecord
	if err := db.Where("id = ?", attendanceID).
		Preload("Course").First(&attendance).Error; err != nil {
		utils.Error(c, http.StatusNotFound, "出勤记录不存在")
		return
	}

	// 验证课程是否属于当前用户
	if attendance.Course.UserID != userID {
		utils.Error(c, http.StatusForbidden, "无权限操作此记录")
		return
	}

	// 更新出勤状态
	attendance.Status = req.Status
	attendance.Notes = req.Notes

	if req.Status == "attend" {
		now := time.Now()
		attendance.CheckInTime = &now
	}

	if err := db.Save(&attendance).Error; err != nil {
		utils.Error(c, http.StatusInternalServerError, "更新出勤记录失败")
		return
	}

	utils.Success(c, "更新成功", attendance)
}

// GetReminders 获取需要提醒的出勤记录（24小时内）
func GetReminders(c *gin.Context) {
	userID := c.GetUint("userID")

	fmt.Printf("🔔 开始检查提醒 - 用户ID: %d\n", userID)

	db := database.GetDB()
	now := time.Now()
	fmt.Printf("⏰ 当前时间: %s\n", now.Format("2006-01-02 15:04:05"))

	var reminders []gin.H

	// 查询活跃课程
	var courses []models.Course
	err := db.Where("user_id = ? AND is_active = ?", userID, true).
		Preload("Schedules", "is_active = ?", true).
		Find(&courses).Error

	if err != nil {
		fmt.Printf("❌ 查询课程失败: %v\n", err)
		utils.Error(c, http.StatusInternalServerError, "查询课程失败")
		return
	}

	fmt.Printf("📊 查询到 %d 个活跃课程\n", len(courses))

	// 显示所有课程和排课信息
	for _, course := range courses {
		fmt.Printf("📚 课程: %s (ID: %d), 排课数量: %d\n", course.Name, course.ID, len(course.Schedules))
		for _, schedule := range course.Schedules {
			fmt.Printf("  📅 排课: 星期%d, %s-%s\n", schedule.Weekday, schedule.StartTime, schedule.EndTime)
		}
	}

	for _, course := range courses {
		fmt.Printf("\n🎯 开始检查课程: %s (ID: %d)\n", course.Name, course.ID)
		
		for _, schedule := range course.Schedules {
			fmt.Printf("  📅 检查排课: 星期%d, %s-%s\n", schedule.Weekday, schedule.StartTime, schedule.EndTime)
			
			// 检查未来24小时内的课程（扩展到未来7天，确保覆盖）
			fmt.Printf("    🔍 检查未来7天课程安排...\n")
			for d := 0; d <= 6; d++ { // 今天到未来6天
				checkDate := now.AddDate(0, 0, d)
				checkDateStr := checkDate.Format("2006-01-02")
				
				// 检查是否是上课日
				weekday := int(checkDate.Weekday())
				if weekday == 0 {
					weekday = 7
				}

				fmt.Printf("    📋 检查日期: %s (星期%d), 排课星期: %d\n", checkDateStr, weekday, schedule.Weekday)

				if weekday == schedule.Weekday {
					fmt.Printf("    ✅ 是上课日!\n")
					
					// 检查是否已经发送过提醒
					var attendance models.AttendanceRecord
					db.Where("course_id = ? AND schedule_date = ?", course.ID, checkDateStr).
						First(&attendance)

					fmt.Printf("    📊 出勤记录状态: 存在=%t, 已提醒=%t\n", attendance.ID > 0, attendance.ReminderSent)

					// 计算课程开始时间
					scheduleTime, err := time.Parse("15:04", schedule.StartTime)
					if err != nil {
						fmt.Printf("    ❌ 解析时间失败: %v\n", err)
						continue
					}
					
					courseStartTime := time.Date(
						checkDate.Year(), checkDate.Month(), checkDate.Day(),
						scheduleTime.Hour(), scheduleTime.Minute(), 0, 0, time.Local,
					)
					
					timeDiff := courseStartTime.Sub(now)
					twentyFourHours := 24 * time.Hour
					
					fmt.Printf("    ⏱️ 时间差: %v (%.2f小时)\n", timeDiff, timeDiff.Hours())
					fmt.Printf("    📅 课程开始时间: %s\n", courseStartTime.Format("2006-01-02 15:04:05"))
					fmt.Printf("    📊 判断条件: timeDiff > 0 && timeDiff <= 24h -> %t && %t\n", 
						timeDiff > 0, timeDiff <= twentyFourHours)
					
					// 调试：检查具体的课程信息
					fmt.Printf("    🔍 课程详细信息: 课程ID=%d, 课程名=%s, 排课星期=%d, 开始时间=%s\n", 
						course.ID, course.Name, schedule.Weekday, schedule.StartTime)
					
					// 只提醒24小时内的课程
					if timeDiff > 0 && timeDiff <= twentyFourHours {
						fmt.Printf("    ✅ 课程在24小时内!\n")
						
						// 如果没有出勤记录，先创建出勤记录
						if attendance.ID == 0 {
							fmt.Printf("    ➕ 创建新的出勤记录\n")
							attendance = models.AttendanceRecord{
								CourseID:     course.ID,
								ScheduleDate: checkDateStr,
								Status:       "pending",
								ReminderSent: false,
							}
							if err := db.Create(&attendance).Error; err != nil {
								fmt.Printf("    ❌ 创建出勤记录失败: %v\n", err)
								continue
							}
							fmt.Printf("    ✅ 出勤记录创建成功, ID: %d\n", attendance.ID)
						}

						// 如果未发送提醒
						if !attendance.ReminderSent {
							fmt.Printf("    🔔 添加提醒到列表\n")
							reminders = append(reminders, gin.H{
								"courseId":     course.ID,
								"courseName":   course.Name,
								"scheduleDate": checkDateStr,
								"startTime":    schedule.StartTime,
								"endTime":      schedule.EndTime,
								"attendanceId": attendance.ID,
							})

							// 标记为已发送提醒
							attendance.ReminderSent = true
							if err := db.Save(&attendance).Error; err != nil {
								fmt.Printf("    ❌ 更新提醒状态失败: %v\n", err)
							} else {
								fmt.Printf("    ✅ 提醒状态更新成功\n")
							}
						} else {
							fmt.Printf("    ⚠️ 提醒已发送过，跳过\n")
						}
					} else {
						fmt.Printf("    ❌ 课程不在24小时内或已过期\n")
						if timeDiff <= 0 {
							fmt.Printf("    💡 原因: 课程已开始或已过期\n")
						} else {
							fmt.Printf("    💡 原因: 课程还有%.2f小时才开始\n", timeDiff.Hours())
						}
					}
				} else {
					fmt.Printf("    ❌ 不是上课日 (排课: 星期%d, 检查日: 星期%d)\n", schedule.Weekday, weekday)
				}
			}
		}
	}

	fmt.Printf("🔚 提醒检查完成，找到 %d 个需要提醒的课程\n", len(reminders))
	if len(reminders) == 0 {
		fmt.Printf("❌ 未找到需要提醒的课程，可能原因:")
		fmt.Printf("   1. 课程时间不在24小时内")
		fmt.Printf("   2. 课程状态不活跃")
		fmt.Printf("   3. 排课设置有问题")
		fmt.Printf("   4. 今天没有对应排课的课程")
	}
	utils.Success(c, "获取成功", reminders)
}

// SendReminder 发送提醒
func SendReminder(c *gin.Context) {
	userID := c.GetUint("userID")
	attendanceID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		utils.Error(c, http.StatusBadRequest, "无效的出勤记录ID")
		return
	}

	db := database.GetDB()

	// 查找出勤记录
	var attendance models.AttendanceRecord
	if err := db.Where("id = ?", attendanceID).
		Preload("Course").First(&attendance).Error; err != nil {
		utils.Error(c, http.StatusNotFound, "出勤记录不存在")
		return
	}

	// 验证课程是否属于当前用户
	if attendance.Course.UserID != userID {
		utils.Error(c, http.StatusForbidden, "无权限操作此记录")
		return
	}

	// 标记为已发送提醒
	attendance.ReminderSent = true
	if err := db.Save(&attendance).Error; err != nil {
		utils.Error(c, http.StatusInternalServerError, "更新提醒状态失败")
		return
	}

	utils.Success(c, "提醒发送成功", nil)
}