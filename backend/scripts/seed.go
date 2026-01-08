package main

import (
	"log"
	"golang.org/x/crypto/bcrypt"
	"course-management-backend/database"
	"course-management-backend/models"
	"gorm.io/gorm"
)

func main() {
	// 初始化数据库
	if err := database.InitDatabase(); err != nil {
		log.Fatalf("数据库初始化失败: %v", err)
	}

	db := database.GetDB()

	log.Println("开始插入测试数据...")

	// 创建测试用户
	var user models.User
	result := db.Where("username = ?", "testuser").First(&user)
	if result.Error != nil {
		// 用户不存在，创建新用户
		hashedPassword, _ := bcrypt.GenerateFromPassword([]byte("123456"), bcrypt.DefaultCost)
		user = models.User{
			Username: "testuser",
			Password: string(hashedPassword),
			Email:    "test@example.com",
		}
		if err := db.Create(&user).Error; err != nil {
			log.Fatalf("创建测试用户失败: %v", err)
		}
		log.Println("创建测试用户成功")
	} else {
		log.Println("测试用户已存在")
	}

	// 创建测试课程
	courses := []models.Course{
		{
			UserID:          user.ID,
			Name:            "少儿英语培训班",
			TotalAmount:     3000.00,
			RegularSessions:  20,
			BonusSessions:    2,
			Category:        "培训",
			Description:     "少儿英语基础培训班，适合6-12岁儿童",
			IsActive:        true,
		},
		{
			UserID:          user.ID,
			Name:            "瑜伽健身卡",
			TotalAmount:     1200.00,
			RegularSessions:  12,
			BonusSessions:    1,
			Category:        "健身",
			Description:     "瑜伽课程，包含基础和进阶练习",
			IsActive:        true,
		},
		{
			UserID:          user.ID,
			Name:            "美容护肤套餐",
			TotalAmount:     5000.00,
			RegularSessions:  10,
			BonusSessions:    2,
			Category:        "美容",
			Description:     "面部护理和身体护理套餐",
			IsActive:        true,
		},
	}

	for _, courseData := range courses {
		var course models.Course
		result := db.Where("user_id = ? AND name = ?", courseData.UserID, courseData.Name).First(&course)
		if result.Error != nil {
			// 课程不存在，创建新课程
			if err := db.Create(&courseData).Error; err != nil {
				log.Printf("创建课程失败: %v", err)
				continue
			}
			course = courseData
			log.Printf("创建课程成功: %s", course.Name)
		} else {
			log.Printf("课程已存在: %s", course.Name)
		}

		// 为每个课程创建时间安排
		createCourseSchedules(db, course.ID, course.Name)
	}

	log.Println("测试数据插入完成")
	log.Println("测试账号: testuser / 123456")
}

func createCourseSchedules(db *gorm.DB, courseID uint, courseName string) {
	switch courseName {
	case "少儿英语培训班":
		schedule := models.CourseSchedule{
			CourseID:   courseID,
			Weekday:    6, // 周六
			StartTime:  "09:00",
			EndTime:    "10:30",
			Location:   "教室A",
			Instructor: "王老师",
			IsActive:   true,
		}
		db.Where("course_id = ? AND weekday = ? AND start_time = ?", 
			courseID, schedule.Weekday, schedule.StartTime).
			FirstOrCreate(&schedule)

	case "瑜伽健身卡":
		// 周二的课程
		tuesdaySchedule := models.CourseSchedule{
			CourseID:   courseID,
			Weekday:    2, // 周二
			StartTime:  "19:00",
			EndTime:    "20:30",
			Location:   "瑜伽室",
			Instructor: "李教练",
			IsActive:   true,
		}
		db.Where("course_id = ? AND weekday = ? AND start_time = ?", 
			courseID, tuesdaySchedule.Weekday, tuesdaySchedule.StartTime).
			FirstOrCreate(&tuesdaySchedule)

		// 周四的课程
		thursdaySchedule := models.CourseSchedule{
			CourseID:   courseID,
			Weekday:    4, // 周四
			StartTime:  "19:00",
			EndTime:    "20:30",
			Location:   "瑜伽室",
			Instructor: "李教练",
			IsActive:   true,
		}
		db.Where("course_id = ? AND weekday = ? AND start_time = ?", 
			courseID, thursdaySchedule.Weekday, thursdaySchedule.StartTime).
			FirstOrCreate(&thursdaySchedule)

	case "美容护肤套餐":
		schedule := models.CourseSchedule{
			CourseID:   courseID,
			Weekday:    7, // 周日
			StartTime:  "14:00",
			EndTime:    "16:00",
			Location:   "美容室",
			Instructor: "张美容师",
			IsActive:   true,
		}
		db.Where("course_id = ? AND weekday = ? AND start_time = ?", 
			courseID, schedule.Weekday, schedule.StartTime).
			FirstOrCreate(&schedule)
	}
}