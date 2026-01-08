package models

import (
	"time"
	"gorm.io/gorm"
)

// AttendanceRecord 出勤记录模型
type AttendanceRecord struct {
	ID           uint      `json:"id" gorm:"primaryKey"`
	CourseID     uint      `json:"courseId" gorm:"not null;index"`
	ScheduleDate string    `json:"scheduleDate" gorm:"not null;type:date;index"`
	Status       string    `json:"status" gorm:"not null;default:pending;type:enum('pending','attend','absent')"`
	CheckInTime  *time.Time `json:"checkInTime"`
	Notes        string    `json:"notes" gorm:"type:text"`
	ReminderSent bool      `json:"reminderSent" gorm:"default:false"`
	CreatedAt    time.Time `json:"createdAt"`
	UpdatedAt    time.Time `json:"updatedAt"`
	DeletedAt    gorm.DeletedAt `json:"-" gorm:"index"`
	
	// 关联
	Course Course `json:"-" gorm:"foreignKey:CourseID"`
	Consumptions []SessionConsumption `json:"-" gorm:"foreignKey:AttendanceID"`
}

// CheckIn 签到
func (ar *AttendanceRecord) CheckIn() {
	ar.Status = "attend"
	now := time.Now()
	ar.CheckInTime = &now
}

// TakeLeave 请假
func (ar *AttendanceRecord) TakeLeave(notes string) {
	ar.Status = "absent"
	ar.Notes = notes
}

// GetStatusText 获取状态描述
func (ar *AttendanceRecord) GetStatusText() string {
	statusMap := map[string]string{
		"pending": "待上课",
		"attend":  "已上课",
		"absent":  "请假",
	}
	if text, exists := statusMap[ar.Status]; exists {
		return text
	}
	return ar.Status
}

// AttendanceRequest 出勤请求
type AttendanceRequest struct {
	Status string `json:"status" binding:"required,oneof=attend absent"`
	Notes  string `json:"notes"`
}

// AttendanceResponse 出勤响应
type AttendanceResponse struct {
	AttendanceRecord
	CourseName string `json:"courseName"`
}