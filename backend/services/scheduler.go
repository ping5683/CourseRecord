package services

import (
	"log"
	"time"
	"course-management-backend/database"
	"course-management-backend/models"

	"github.com/robfig/cron/v3"
)

// SchedulerService 定时任务服务
type SchedulerService struct {
	cron *cron.Cron
}

// NewSchedulerService 创建新的调度器服务
func NewSchedulerService() *SchedulerService {
	return &SchedulerService{
		cron: cron.New(),
	}
}

// Start 启动定时任务
func (s *SchedulerService) Start() {
	log.Println("启动课程提醒调度器...")

	// 每小时检查一次明天的课程
	s.cron.AddFunc("0 * * * *", s.checkTomorrowCourses)
	
	// 每天晚上8点检查第二天的课程并发送提醒
	s.cron.AddFunc("0 20 * * *", s.sendEveningReminders)

	s.cron.Start()
	log.Println("课程提醒调度器启动成功")
}

// Stop 停止定时任务
func (s *SchedulerService) Stop() {
	if s.cron != nil {
		s.cron.Stop()
		log.Println("课程提醒调度器已停止")
	}
}

// checkTomorrowCourses 检查明天的课程
func (s *SchedulerService) checkTomorrowCourses() {
	defer func() {
		if r := recover(); r != nil {
			log.Printf("检查明天课程时出错: %v", r)
		}
	}()

	tomorrow := time.Now().AddDate(0, 0, 1)
	tomorrowStr := tomorrow.Format("2006-01-02")
	weekday := int(tomorrow.Weekday())
	if weekday == 0 {
		weekday = 7 // 周日转换为7
	}

	db := database.GetDB()

	var courses []models.Course
	err := db.Where("is_active = ?", true).
		Preload("Schedules", "weekday = ? AND is_active = ?", weekday, true).
		Find(&courses).Error

	if err != nil {
		log.Printf("查询明天课程失败: %v", err)
		return
	}

	for _, course := range courses {
		// 检查是否已经有明天的出勤记录
		var existingRecord models.AttendanceRecord
		err := db.Where("course_id = ? AND schedule_date = ?", course.ID, tomorrowStr).First(&existingRecord).Error
		if err != nil {
			// 创建明天的出勤记录
			newRecord := models.AttendanceRecord{
				CourseID:     course.ID,
				ScheduleDate: tomorrowStr,
				Status:       "pending",
				ReminderSent: false,
			}
			if err := db.Create(&newRecord).Error; err != nil {
				log.Printf("创建出勤记录失败 (课程ID: %d): %v", course.ID, err)
			}
		}
	}

	log.Printf("检查明天课程完成，发现 %d 个课程", len(courses))
}

// sendEveningReminders 发送晚间提醒
func (s *SchedulerService) sendEveningReminders() {
	defer func() {
		if r := recover(); r != nil {
			log.Printf("发送晚间提醒时出错: %v", r)
		}
	}()

	tomorrow := time.Now().AddDate(0, 0, 1)
	tomorrowStr := tomorrow.Format("2006-01-02")
	weekday := int(tomorrow.Weekday())
	if weekday == 0 {
		weekday = 7
	}

	db := database.GetDB()

	var coursesForTomorrow []models.Course
	err := db.Where("is_active = ?", true).
		Preload("Schedules", "weekday = ? AND is_active = ?", weekday, true).
		Preload("User").
		Preload("AttendanceRecords", "schedule_date = ?", tomorrowStr).
		Find(&coursesForTomorrow).Error

	if err != nil {
		log.Printf("查询明日课程失败: %v", err)
		return
	}

	for _, course := range coursesForTomorrow {
		needsReminder := true
		
		for _, record := range course.AttendanceRecords {
			if record.ScheduleDate == tomorrowStr && record.ReminderSent {
				needsReminder = false
				break
			}
		}

		if needsReminder {
			// 发送提醒通知
			err := SendCourseReminder(&course, tomorrowStr)
			if err != nil {
				log.Printf("发送课程提醒失败 (课程: %s): %v", course.Name, err)
				continue
			}

			// 标记提醒已发送
			if len(course.AttendanceRecords) > 0 {
				err := db.Model(&course.AttendanceRecords[0]).
					Update("reminder_sent", true).Error
				if err != nil {
					log.Printf("更新提醒状态失败: %v", err)
				}
			}
		}
	}

	log.Printf("发送晚间提醒完成，处理了 %d 个课程", len(coursesForTomorrow))
}

// TriggerReminderCheck 手动触发提醒检查（用于测试）
func (s *SchedulerService) TriggerReminderCheck() {
	log.Println("手动触发提醒检查...")
	s.checkTomorrowCourses()
	s.sendEveningReminders()
	log.Println("手动提醒检查完成")
}