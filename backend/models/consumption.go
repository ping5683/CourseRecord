package models

import (
	"time"
	"gorm.io/gorm"
)

// SessionConsumption 消课记录模型
type SessionConsumption struct {
	ID                uint       `json:"id" gorm:"primaryKey"`
	CourseID          uint       `json:"courseId" gorm:"not null;index"`
	AttendanceID      *uint      `json:"attendanceId" gorm:"index"`
	SessionsConsumed  int        `json:"sessionsConsumed" gorm:"not null;default:1"`
	SessionType      string     `json:"sessionType" gorm:"not null;default:regular;type:enum('regular','bonus')"`
	Description      string     `json:"description" gorm:"size:200"`
	CreatedAt        time.Time  `json:"createdAt"`
	UpdatedAt        time.Time  `json:"updatedAt"`
	DeletedAt        gorm.DeletedAt `json:"-" gorm:"index"`
	
	// 关联
	Course     Course           `json:"-" gorm:"foreignKey:CourseID"`
	Attendance *AttendanceRecord `json:"-" gorm:"foreignKey:AttendanceID"`
}

// GetSessionTypeText 获取课时类型描述
func (sc *SessionConsumption) GetSessionTypeText() string {
	typeMap := map[string]string{
		"regular": "正式课时",
		"bonus":   "赠送课时",
	}
	if text, exists := typeMap[sc.SessionType]; exists {
		return text
	}
	return sc.SessionType
}

// GetConsumptionStats 获取课程消耗统计
type ConsumptionStats struct {
	TotalSessions     int64 `json:"totalSessions"`
	ConsumedSessions  int64 `json:"consumedSessions"`
	RemainingSessions int64 `json:"remainingSessions"`
	AttendanceRate    int   `json:"attendanceRate"`
}