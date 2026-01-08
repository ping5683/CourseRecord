package models

import (
	"gorm.io/gorm"
)

// AutoMigrate 自动迁移所有模型
func AutoMigrate(db *gorm.DB) error {
	return db.AutoMigrate(
		&User{},
		&Course{},
		&CourseSchedule{},
		&AttendanceRecord{},
		&SessionConsumption{},
	)
}