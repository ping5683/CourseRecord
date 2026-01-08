package models

import (
	"time"
	"gorm.io/gorm"
)

// Course 课程模型
type Course struct {
	ID               uint             `json:"id" gorm:"primaryKey"`
	UserID           uint             `json:"userId" gorm:"not null;index"`
	Name             string           `json:"name" gorm:"not null;size:100"`
	TotalAmount      float64          `json:"totalAmount" gorm:"type:decimal(10,2)"`
	RegularSessions  int              `json:"regularSessions" gorm:"default:0"`
	BonusSessions    int              `json:"bonusSessions" gorm:"default:0"`
	ContractImages   string           `json:"contractImages" gorm:"type:text"` // JSON格式存储多个合同图片路径
	IsActive         bool             `json:"isActive" gorm:"default:true"`
	Category         string           `json:"category" gorm:"size:50;default:general"`
	Description      string           `json:"description" gorm:"type:text"`
	CreatedAt        time.Time        `json:"createdAt"`
	UpdatedAt        time.Time        `json:"updatedAt"`
	DeletedAt        gorm.DeletedAt   `json:"-" gorm:"index"`
	
	// 关联
	User             User             `json:"-" gorm:"foreignKey:UserID"`
	Schedules        []CourseSchedule `json:"schedules,omitempty" gorm:"foreignKey:CourseID"`
	AttendanceRecords []AttendanceRecord `json:"attendanceRecords,omitempty" gorm:"foreignKey:CourseID"`
	Consumptions     []SessionConsumption `json:"consumptions,omitempty" gorm:"foreignKey:CourseID"`
}

// GetTotalSessions 获取总课时数
func (c *Course) GetTotalSessions() int {
	return c.RegularSessions + c.BonusSessions
}

// GetConsumedSessions 获取已消耗课时数
func (c *Course) GetConsumedSessions(db *gorm.DB) (int64, error) {
	var count int64
	err := db.Model(&SessionConsumption{}).Where("course_id = ?", c.ID).Select("COALESCE(SUM(sessions_consumed), 0)").Scan(&count).Error
	return count, err
}

// GetRemainingSessions 获取剩余课时数
func (c *Course) GetRemainingSessions(db *gorm.DB) (int64, error) {
	total := int64(c.GetTotalSessions())
	consumed, err := c.GetConsumedSessions(db)
	if err != nil {
		return 0, err
	}
	remaining := total - consumed
	if remaining < 0 {
		remaining = 0
	}
	return remaining, nil
}

// CourseWithStats 带统计信息的课程
type CourseWithStats struct {
	Course
	TotalSessions     int64 `json:"totalSessions"`
	ConsumedSessions  int64 `json:"consumedSessions"`
	RemainingSessions int64 `json:"remainingSessions"`
}

// CourseRequest 课程请求结构
type CourseRequest struct {
	Name            string              `json:"name" binding:"required,min=1,max=100"`
	TotalAmount     float64             `json:"totalAmount"`
	RegularSessions int                 `json:"regularSessions" binding:"min=0"`
	BonusSessions   int                 `json:"bonusSessions" binding:"min=0"`
	ContractImages  []string            `json:"contractImages"` // 多个合同图片路径
	Category        string              `json:"category"`
	Description     string              `json:"description"`
	Schedules       []CourseScheduleRequest `json:"schedules"`
}

// CourseScheduleRequest 课程安排请求
type CourseScheduleRequest struct {
	Weekday   int    `json:"weekday" binding:"required,min=1,max=7"`
	StartTime string `json:"startTime" binding:"required"`
	EndTime   string `json:"endTime" binding:"required"`
	Location  string `json:"location"`
	Instructor string `json:"instructor"`
}