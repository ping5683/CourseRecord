package models

import (
	"errors"
	"time"
	"gorm.io/gorm"
)

// CourseSchedule 课程安排模型
type CourseSchedule struct {
	ID        uint      `json:"id" gorm:"primaryKey"`
	CourseID  uint      `json:"courseId" gorm:"not null;index"`
	Weekday   int       `json:"weekday" gorm:"not null"` // 1-7 对应周一到周日
	StartTime string    `json:"startTime" gorm:"not null;type:varchar(5)"`
	EndTime   string    `json:"endTime" gorm:"not null;type:varchar(5)"`
	IsActive  bool      `json:"isActive" gorm:"default:true"`
	Location  string    `json:"location" gorm:"size:100"`
	Instructor string   `json:"instructor" gorm:"size:50"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
	DeletedAt gorm.DeletedAt `json:"-" gorm:"index"`
	
	// 关联
	Course Course `json:"-" gorm:"foreignKey:CourseID"`
}

// BeforeCreate GORM钩子 - 验证时间
func (cs *CourseSchedule) BeforeCreate(tx *gorm.DB) error {
	return cs.validateTime()
}

// BeforeUpdate GORM钩子 - 验证时间
func (cs *CourseSchedule) BeforeUpdate(tx *gorm.DB) error {
	return cs.validateTime()
}

// validateTime 验证时间逻辑
func (cs *CourseSchedule) validateTime() error {
	if cs.StartTime >= cs.EndTime {
		return errors.New("开始时间必须早于结束时间")
	}
	if cs.Weekday < 1 || cs.Weekday > 7 {
		return errors.New("星期几必须在1-7之间")
	}
	return nil
}

// GetWeekdayText 获取星期几的中文描述
func (cs *CourseSchedule) GetWeekdayText() string {
	weekdays := []string{"", "周一", "周二", "周三", "周四", "周五", "周六", "周日"}
	if cs.Weekday >= 1 && cs.Weekday <= 7 {
		return weekdays[cs.Weekday]
	}
	return ""
}

// IsInTimeRange 检查当前时间是否在课程时间段内
func (cs *CourseSchedule) IsInTimeRange(checkTime time.Time) bool {
	currentTime := checkTime.Format("15:04")
	return currentTime >= cs.StartTime && currentTime <= cs.EndTime
}