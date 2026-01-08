package handlers

import (
	"net/http"
	"strconv"
	"course-management-backend/database"
	"course-management-backend/models"
	"course-management-backend/utils"

	"github.com/gin-gonic/gin"
)

// CreateConsumption 创建课时消耗记录
func CreateConsumption(c *gin.Context) {
	userID := c.GetUint("userID")

	var req struct {
		AttendanceID     uint   `json:"attendanceId" binding:"required"`
		SessionsConsumed int    `json:"sessionsConsumed" binding:"required,min=1"`
		SessionType      string `json:"sessionType" binding:"required,oneof=regular bonus"`
		Description      string `json:"description"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationError(c, err.Error())
		return
	}

	db := database.GetDB()

	// 查找出勤记录
	var attendance models.AttendanceRecord
	if err := db.Where("id = ?", req.AttendanceID).
		Preload("Course").First(&attendance).Error; err != nil {
		utils.Error(c, http.StatusNotFound, "出勤记录不存在")
		return
	}

	// 验证课程是否属于当前用户
	if attendance.Course.UserID != userID {
		utils.Error(c, http.StatusForbidden, "无权限操作此记录")
		return
	}

	// 验证出勤状态
	if attendance.Status != "attend" {
		utils.Error(c, http.StatusBadRequest, "只有已上课的出勤记录才能消耗课时")
		return
	}

	// 检查剩余课时是否足够
	remaining, err := attendance.Course.GetRemainingSessions(db)
	if err != nil {
		utils.Error(c, http.StatusInternalServerError, "查询剩余课时失败")
		return
	}

	if int64(req.SessionsConsumed) > remaining {
		utils.Error(c, http.StatusBadRequest, "剩余课时不足")
		return
	}

	// 创建课时消耗记录
	consumption := models.SessionConsumption{
		CourseID:        attendance.CourseID,
		AttendanceID:    &req.AttendanceID,
		SessionsConsumed: req.SessionsConsumed,
		SessionType:     req.SessionType,
		Description:     req.Description,
	}

	if err := db.Create(&consumption).Error; err != nil {
		utils.Error(c, http.StatusInternalServerError, "创建课时消耗记录失败")
		return
	}

	utils.Success(c, "课时消耗记录创建成功", consumption)
}

// GetCourseConsumptions 获取课程课时消耗记录
func GetCourseConsumptions(c *gin.Context) {
	userID := c.GetUint("userID")
	courseID, err := strconv.ParseUint(c.Param("courseId"), 10, 32)
	if err != nil {
		utils.Error(c, http.StatusBadRequest, "无效的课程ID")
		return
	}

	db := database.GetDB()

	// 验证课程是否存在且属于当前用户
	var course models.Course
	if err := db.Where("id = ? AND user_id = ?", courseID, userID).First(&course).Error; err != nil {
		utils.Error(c, http.StatusNotFound, "课程不存在")
		return
	}

	// 查询课时消耗记录
	var consumptions []models.SessionConsumption
	err = db.Where("course_id = ?", courseID).
		Preload("Attendance").
		Order("created_at DESC").
		Find(&consumptions).Error

	if err != nil {
		utils.Error(c, http.StatusInternalServerError, "查询课时消耗记录失败")
		return
	}

	utils.Success(c, "获取成功", consumptions)
}

// DeleteConsumption 删除课时消耗记录
func DeleteConsumption(c *gin.Context) {
	userID := c.GetUint("userID")
	consumptionID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		utils.Error(c, http.StatusBadRequest, "无效的消耗记录ID")
		return
	}

	db := database.GetDB()

	// 查找消耗记录
	var consumption models.SessionConsumption
	if err := db.Where("id = ?", consumptionID).
		Preload("Course").First(&consumption).Error; err != nil {
		utils.Error(c, http.StatusNotFound, "消耗记录不存在")
		return
	}

	// 验证课程是否属于当前用户
	if consumption.Course.UserID != userID {
		utils.Error(c, http.StatusForbidden, "无权限操作此记录")
		return
	}

	// 删除消耗记录
	if err := db.Delete(&consumption).Error; err != nil {
		utils.Error(c, http.StatusInternalServerError, "删除消耗记录失败")
		return
	}

	utils.Success(c, "删除成功", nil)
}