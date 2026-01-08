package services

import (
	"fmt"
	"log"
	"time"
	"course-management-backend/models"
)

// NotificationManager 通知管理器
type NotificationManager struct {
	subscriptions map[uint][]map[string]interface{} // userID -> subscriptions
}

var notificationManager = &NotificationManager{
	subscriptions: make(map[uint][]map[string]interface{}),
}

// SaveNotificationSubscription 保存推送订阅
func SaveNotificationSubscription(userID uint, subscription map[string]interface{}) {
	if notificationManager.subscriptions[userID] == nil {
		notificationManager.subscriptions[userID] = make([]map[string]interface{}, 0)
	}
	
	notificationManager.subscriptions[userID] = append(
		notificationManager.subscriptions[userID], 
		subscription,
	)
	
	log.Printf("用户 %d 已保存推送订阅", userID)
}

// RemoveNotificationSubscription 移除推送订阅
func RemoveNotificationSubscription(userID uint, subscription map[string]interface{}) {
	if subscriptions, exists := notificationManager.subscriptions[userID]; exists {
		for i, sub := range subscriptions {
			if sub["endpoint"] == subscription["endpoint"] {
				notificationManager.subscriptions[userID] = append(
					subscriptions[:i],
					subscriptions[i+1:]...)
				break
			}
		}
	}
}

// SendCourseReminder 发送课程提醒
func SendCourseReminder(course *models.Course, date string) error {
	title := "课程提醒"
	body := buildReminderMessage(course, date)
	
	notification := map[string]interface{}{
		"title": title,
		"body":  body,
		"icon":  "/icon-192x192.png",
		"tag":   fmt.Sprintf("course-%d-%s", course.ID, date),
		"requireInteraction": true,
		"actions": []map[string]string{
			{"action": "attend", "title": "上课"},
			{"action": "absent", "title": "请假"},
		},
		"data": map[string]interface{}{
			"type":      "course_reminder",
			"courseId":  course.ID,
			"courseName": course.Name,
			"date":      date,
			"action":    "reminder",
		},
	}

	// 发送给课程的所有相关用户
	return sendNotificationToUser(course.UserID, notification)
}

// SendConsumptionConfirmation 发送消课确认通知
func SendConsumptionConfirmation(course *models.Course, attendance *models.AttendanceRecord, consumption *models.SessionConsumption) error {
	title := "消课成功"
	body := fmt.Sprintf("%s 已消耗 %d 个%s", course.Name, consumption.SessionsConsumed, consumption.GetSessionTypeText())
	
	notification := map[string]interface{}{
		"title": title,
		"body":  body,
		"icon":  "/icon-192x192.png",
		"tag":   fmt.Sprintf("consumption-%d", consumption.ID),
		"data": map[string]interface{}{
			"type":         "consumption_confirmation",
			"courseId":     course.ID,
			"attendanceId": attendance.ID,
			"consumptionId": consumption.ID,
		},
	}

	return sendNotificationToUser(course.UserID, notification)
}

// buildReminderMessage 构建提醒消息内容
func buildReminderMessage(course *models.Course, date string) string {
	var message string
	
	// 解析日期
	t, _ := time.Parse("2006-01-02", date)
	dateText := t.Format("01月02日")
	weekdayText := []string{"周日", "周一", "周二", "周三", "周四", "周五", "周六"}[t.Weekday()]
	
	message = fmt.Sprintf("%s %s %s", dateText, weekdayText, course.Name)
	
	// 添加时间信息
	if len(course.Schedules) > 0 {
		schedule := course.Schedules[0]
		message += fmt.Sprintf(" %s-%s", schedule.StartTime, schedule.EndTime)
		
		if schedule.Location != "" {
			message += fmt.Sprintf(" 地点:%s", schedule.Location)
		}
		
		if schedule.Instructor != "" {
			message += fmt.Sprintf(" 老师:%s", schedule.Instructor)
		}
	}

	return message
}

// sendNotificationToUser 发送通知给指定用户
func sendNotificationToUser(userID uint, notification map[string]interface{}) error {
	subscriptions, exists := notificationManager.subscriptions[userID]
	if !exists || len(subscriptions) == 0 {
		log.Printf("用户 %d 没有推送订阅", userID)
		return fmt.Errorf("用户没有推送订阅")
	}

	// 在实际实现中，这里会使用 Web Push Protocol 发送推送
	// 这里只是模拟实现
	log.Printf("模拟发送推送通知 - 用户 %d: %+v", userID, map[string]interface{}{
		"title": notification["title"],
		"body":  notification["body"],
	})

	// 实际实现示例（需要 web-push 库）:
	/*
	import "github.com/SherClockHolmes/webpush-go"
	
	for _, subscription := range subscriptions {
		s := &webpush.Subscription{
			Endpoint: subscription["endpoint"].(string),
			Keys: webpush.Keys{
				Auth: subscription["keys"].(map[string]interface{})["auth"].(string),
				P256dh: subscription["keys"].(map[string]interface{})["p256dh"].(string),
			},
		}
		
		payload, _ := json.Marshal(notification)
		
		resp, err := webpush.SendNotification(s, payload, &webpush.Options{
			VAPIDPublicKey:  getVAPIDPublicKey(),
			VAPIDPrivateKey: getVAPIDPrivateKey(),
			Subscriber:      getVAPIDEmail(),
		})
		
		if err != nil && resp.StatusCode == 410 {
			// 订阅失效，移除它
			RemoveNotificationSubscription(userID, subscription)
		}
	}
	*/
	
	return nil
}

// GetSubscriptions 获取用户的订阅信息
func GetSubscriptions(userID uint) []map[string]interface{} {
	if subscriptions, exists := notificationManager.subscriptions[userID]; exists {
		return subscriptions
	}
	return make([]map[string]interface{}, 0)
}