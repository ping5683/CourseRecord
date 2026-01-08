package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"time"
	"course-management-backend/database"
	"course-management-backend/models"
	"course-management-backend/utils"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// GetCourses 获取课程列表
func GetCourses(c *gin.Context) {
	userID := c.GetUint("userID")
	page, _ := strconv.ParseInt(c.DefaultQuery("page", "1"), 10, 64)
	limit, _ := strconv.ParseInt(c.DefaultQuery("limit", "10"), 10, 64)
	category := c.Query("category")
	isActive := c.Query("isActive")

	db := database.GetDB()

	query := db.Where("user_id = ?", userID)
	
	if category != "" {
		query = query.Where("category = ?", category)
	}
	if isActive != "" {
		active := isActive == "true"
		query = query.Where("is_active = ?", active)
	}

	// 计算总数
	var total int64
	query.Model(&models.Course{}).Count(&total)

	// 查询课程
	var courses []models.Course
	offset := (page - 1) * limit
	err := query.Preload("Schedules", "is_active = ?", true).
		Order("created_at DESC").
		Limit(int(limit)).
		Offset(int(offset)).
		Find(&courses).Error

	if err != nil {
		utils.Error(c, http.StatusInternalServerError, "查询课程失败")
		return
	}

	// 添加统计信息
	var coursesWithStats []models.CourseWithStats
	for _, course := range courses {
		consumed, _ := course.GetConsumedSessions(db)
		remaining, _ := course.GetRemainingSessions(db)
		
		coursesWithStats = append(coursesWithStats, models.CourseWithStats{
			Course:           course,
			TotalSessions:    int64(course.GetTotalSessions()),
			ConsumedSessions: consumed,
			RemainingSessions: remaining,
		})
	}

	totalPages := (total + limit - 1) / limit
	pagination := utils.Pagination{
		Page:       page,
		Limit:      limit,
		Total:      total,
		TotalPages: totalPages,
	}

	utils.SuccessWithPagination(c, "获取成功", coursesWithStats, pagination)
}

// GetTodayCourses 获取今日课程
func GetTodayCourses(c *gin.Context) {
	userID := c.GetUint("userID")
	
	today := time.Now().Format("2006-01-02")
	weekday := int(time.Now().Weekday())
	if weekday == 0 {
		weekday = 7 // 周日转换为7
	}

	db := database.GetDB()

	var courses []models.Course
	err := db.Where("user_id = ? AND is_active = ?", userID, true).
		Preload("Schedules", "weekday = ? AND is_active = ?", weekday, true).
		Preload("AttendanceRecords", "schedule_date = ?", today).
		Find(&courses).Error

	if err != nil {
		utils.Error(c, http.StatusInternalServerError, "查询今日课程失败")
		return
	}

	// 添加出勤状态
	var result []gin.H
	for _, course := range courses {
		courseData := gin.H{
			"id":            course.ID,
			"name":          course.Name,
			"schedules":     course.Schedules,
			"totalAmount":   course.TotalAmount,
			"remainingSessions": course.BonusSessions + course.RegularSessions,
		}

		hasAttendance := false
		attendanceStatus := "pending"
		
		for _, record := range course.AttendanceRecords {
			if record.ScheduleDate == today {
				hasAttendance = true
				attendanceStatus = record.Status
				break
			}
		}

		courseData["hasAttendance"] = hasAttendance
		courseData["attendanceStatus"] = attendanceStatus
		
		result = append(result, courseData)
	}

	utils.Success(c, "获取成功", result)
}

// GetCourseById 获取课程详情
func GetCourseById(c *gin.Context) {
	userID := c.GetUint("userID")
	courseID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		utils.Error(c, http.StatusBadRequest, "无效的课程ID")
		return
	}

	db := database.GetDB()

	var course models.Course
	err = db.Where("id = ? AND user_id = ?", courseID, userID).
		Preload("Schedules").
		Preload("AttendanceRecords", func(db *gorm.DB) *gorm.DB {
			return db.Order("schedule_date DESC")
		}).
		Preload("Consumptions.Attendance").
		First(&course).Error

	if err != nil {
		utils.Error(c, http.StatusNotFound, "课程不存在")
		return
	}

	consumed, _ := course.GetConsumedSessions(db)
	remaining, _ := course.GetRemainingSessions(db)

	// 解析合同图片JSON数据
	var contractImages []string
	if course.ContractImages != "" {
		if err := json.Unmarshal([]byte(course.ContractImages), &contractImages); err != nil {
			// 如果解析失败，记录错误但继续处理
			fmt.Printf("解析合同图片JSON失败: %v\n", err)
		}
	}

	courseData := gin.H{
		"id":               course.ID,
		"name":             course.Name,
		"totalAmount":      course.TotalAmount,
		"regularSessions":   course.RegularSessions,
		"bonusSessions":     course.BonusSessions,
		"contractImages":   contractImages,
		"isActive":         course.IsActive,
		"category":         course.Category,
		"description":      course.Description,
		"createdAt":        course.CreatedAt,
		"updatedAt":        course.UpdatedAt,
		"schedules":        course.Schedules,
		"attendanceRecords": course.AttendanceRecords,
		"consumptions":     course.Consumptions,
		"totalSessions":    course.GetTotalSessions(),
		"consumedSessions": consumed,
		"remainingSessions": remaining,
	}

	utils.Success(c, "获取成功", courseData)
}

// CreateCourse 创建课程
func CreateCourse(c *gin.Context) {
	userID := c.GetUint("userID")
	
	var req models.CourseRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationError(c, err.Error())
		return
	}

	// 验证必填字段
	if req.Name == "" {
		utils.Error(c, http.StatusBadRequest, "课程名称不能为空")
		return
	}
	
	if req.RegularSessions <= 0 {
		utils.Error(c, http.StatusBadRequest, "正式课时必须大于0")
		return
	}

	db := database.GetDB()

	// 处理合同图片（转换为JSON字符串存储）
	var contractImagesJSON string
	if len(req.ContractImages) > 0 {
		imagesJSON, err := json.Marshal(req.ContractImages)
		if err != nil {
			utils.Error(c, http.StatusInternalServerError, "合同图片格式错误")
			return
		}
		contractImagesJSON = string(imagesJSON)
	}

	// 创建课程
	course := models.Course{
		UserID:          userID,
		Name:            req.Name,
		TotalAmount:      req.TotalAmount,
		RegularSessions:  req.RegularSessions,
		BonusSessions:    req.BonusSessions,
		ContractImages:  contractImagesJSON,
		Category:        req.Category,
		Description:     req.Description,
		IsActive:        true,
	}

	// 开始事务
	tx := db.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	if err := tx.Create(&course).Error; err != nil {
		tx.Rollback()
		utils.Error(c, http.StatusInternalServerError, "创建课程失败")
		return
	}

	// 创建课程安排
	if len(req.Schedules) > 0 {
		for _, scheduleReq := range req.Schedules {
			schedule := models.CourseSchedule{
				CourseID:   course.ID,
				Weekday:    scheduleReq.Weekday,
				StartTime:  scheduleReq.StartTime,
				EndTime:    scheduleReq.EndTime,
				Location:   scheduleReq.Location,
				Instructor: scheduleReq.Instructor,
				IsActive:   true,
			}
			if err := tx.Create(&schedule).Error; err != nil {
				tx.Rollback()
				utils.Error(c, http.StatusInternalServerError, "创建课程安排失败: " + err.Error())
				return
			}
		}
	}

	if err := tx.Commit().Error; err != nil {
		utils.Error(c, http.StatusInternalServerError, "创建课程失败")
		return
	}

	// 查询创建后的完整课程
	var createdCourse models.Course
	db.Preload("Schedules").First(&createdCourse, course.ID)

	utils.Success(c, "创建成功", createdCourse)
}

// UpdateCourse 更新课程
func UpdateCourse(c *gin.Context) {
	userID := c.GetUint("userID")
	courseID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		utils.Error(c, http.StatusBadRequest, "无效的课程ID")
		return
	}

	var req models.CourseRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationError(c, err.Error())
		return
	}

	// 调试日志：显示接收到的数据
	fmt.Printf("更新课程 - 课程ID: %d, 课程名称: %s\n", courseID, req.Name)
	fmt.Printf("接收到的排课安排数量: %d\n", len(req.Schedules))
	for i, schedule := range req.Schedules {
		fmt.Printf("排课安排 %d: 星期%d, %s-%s, 地点: %s, 教师: %s\n", 
			i+1, schedule.Weekday, schedule.StartTime, schedule.EndTime, schedule.Location, schedule.Instructor)
	}

	// 调试日志：显示接收到的合同图片
	if len(req.ContractImages) > 0 {
		fmt.Printf("更新课程合同图片 - 课程ID: %d, 合同图片数量: %d\n", courseID, len(req.ContractImages))
	}

	db := database.GetDB()

	// 查找课程
	var course models.Course
	if err := db.Where("id = ? AND user_id = ?", courseID, userID).First(&course).Error; err != nil {
		utils.Error(c, http.StatusNotFound, "课程不存在")
		return
	}

	// 开始事务
	tx := db.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// 更新课程信息
	course.Name = req.Name
	course.TotalAmount = req.TotalAmount
	course.RegularSessions = req.RegularSessions
	course.BonusSessions = req.BonusSessions
	course.Category = req.Category
	course.Description = req.Description
	
	// 更新合同图片（总是更新，即使为空数组）
	imagesJSON, err := json.Marshal(req.ContractImages)
	if err != nil {
		tx.Rollback()
		utils.Error(c, http.StatusInternalServerError, "合同图片格式错误")
		return
	}
	course.ContractImages = string(imagesJSON)

	if err := tx.Save(&course).Error; err != nil {
		tx.Rollback()
		utils.Error(c, http.StatusInternalServerError, "更新课程失败")
		return
	}

	// 删除原有的课程安排（使用Unscoped强制删除，避免软删除）
	fmt.Printf("开始删除课程安排 - 课程ID: %d\n", course.ID)
	
	// 先查询当前有多少个课程安排
	var existingSchedules []models.CourseSchedule
	tx.Unscoped().Where("course_id = ?", course.ID).Find(&existingSchedules)
	fmt.Printf("删除前课程安排数量: %d\n", len(existingSchedules))
	
	// 执行删除
	if err := tx.Unscoped().Where("course_id = ?", course.ID).Delete(&models.CourseSchedule{}).Error; err != nil {
		tx.Rollback()
		utils.Error(c, http.StatusInternalServerError, "删除原有课程安排失败: " + err.Error())
		return
	}
	
	// 验证删除结果
	var remainingSchedules []models.CourseSchedule
	tx.Unscoped().Where("course_id = ?", course.ID).Find(&remainingSchedules)
	fmt.Printf("删除后课程安排数量: %d\n", len(remainingSchedules))
	fmt.Printf("删除课程安排完成 - 课程ID: %d\n", course.ID)

	// 创建新的课程安排
	if len(req.Schedules) > 0 {
		for _, scheduleReq := range req.Schedules {
			schedule := models.CourseSchedule{
				CourseID:   course.ID,
				Weekday:    scheduleReq.Weekday,
				StartTime:  scheduleReq.StartTime,
				EndTime:    scheduleReq.EndTime,
				Location:   scheduleReq.Location,
				Instructor: scheduleReq.Instructor,
				IsActive:   true,
			}
			if err := tx.Create(&schedule).Error; err != nil {
				tx.Rollback()
				utils.Error(c, http.StatusInternalServerError, "创建课程安排失败: " + err.Error())
				return
			}
		}
	}

	if err := tx.Commit().Error; err != nil {
		utils.Error(c, http.StatusInternalServerError, "更新课程失败")
		return
	}

	// 查询更新后的完整课程
	var updatedCourse models.Course
	db.Preload("Schedules").First(&updatedCourse, course.ID)

	utils.Success(c, "更新成功", updatedCourse)
}

// DeleteCourse 删除课程
func DeleteCourse(c *gin.Context) {
	userID := c.GetUint("userID")
	courseID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		utils.Error(c, http.StatusBadRequest, "无效的课程ID")
		return
	}

	db := database.GetDB()

	// 检查课程是否存在
	var course models.Course
	if err := db.Where("id = ? AND user_id = ?", courseID, userID).First(&course).Error; err != nil {
		utils.Error(c, http.StatusNotFound, "课程不存在")
		return
	}

	if err := db.Delete(&course).Error; err != nil {
		utils.Error(c, http.StatusInternalServerError, "删除课程失败")
		return
	}

	utils.Success(c, "删除成功", nil)
}