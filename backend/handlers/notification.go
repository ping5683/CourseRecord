package handlers

import (
	"net/http"
	"course-management-backend/database"
	"course-management-backend/models"
	"course-management-backend/services"
	"course-management-backend/utils"

	"github.com/gin-gonic/gin"
)

// SubscribeNotifications 订阅推送通知
func SubscribeNotifications(c *gin.Context) {
	userID := c.GetUint("userID")
	
	var subscription map[string]interface{}
	if err := c.ShouldBindJSON(&subscription); err != nil {
		utils.ValidationError(c, err.Error())
		return
	}

	// 验证订阅信息
	endpoint, ok := subscription["endpoint"].(string)
	if !ok || endpoint == "" {
		utils.Error(c, http.StatusBadRequest, "无效的订阅信息")
		return
	}

	// 保存订阅信息（这里简化处理，实际应该存储到数据库）
	services.SaveNotificationSubscription(userID, subscription)

	utils.Success(c, "订阅成功", nil)
}

// UnsubscribeNotifications 取消推送订阅
func UnsubscribeNotifications(c *gin.Context) {
	userID := c.GetUint("userID")
	
	var subscription map[string]interface{}
	c.ShouldBindJSON(&subscription)

	// 移除订阅信息
	services.RemoveNotificationSubscription(userID, subscription)

	utils.Success(c, "取消订阅成功", nil)
}

// TestNotification 发送测试通知
func TestNotification(c *gin.Context) {
	userID := c.GetUint("userID")
	courseIDStr := c.Param("courseId") // 这应该是从请求体获取，但为了兼容现有API结构
	
	if courseIDStr == "" {
		utils.Error(c, http.StatusBadRequest, "缺少课程ID")
		return
	}

	db := database.GetDB()

	var course models.Course
	if err := db.Where("id = ? AND user_id = ?", courseIDStr, userID).First(&course).Error; err != nil {
		utils.Error(c, http.StatusNotFound, "课程不存在")
		return
	}

	// 发送测试提醒
	tomorrow := "2024-01-02" // 这里使用固定日期作为测试
	err := services.SendCourseReminder(&course, tomorrow)
	if err != nil {
		utils.Error(c, http.StatusInternalServerError, "发送测试通知失败")
		return
	}

	utils.Success(c, "测试通知已发送", nil)
}