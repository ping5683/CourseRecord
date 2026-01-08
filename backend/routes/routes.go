package routes

import (
	"course-management-backend/handlers"
	"course-management-backend/middleware"
	"github.com/gin-gonic/gin"
)

// SetupRoutes 设置API路由
func SetupRoutes(r *gin.Engine) {
	// API路由组
	api := r.Group("/api")
	{
		// 认证路由
		authGroup := api.Group("/auth")
		{
			authGroup.POST("/register", handlers.Register)
			authGroup.POST("/login", handlers.Login)
			authGroup.GET("/profile", middleware.AuthRequired(), handlers.GetProfile)
		}

		// 课程路由
		coursesGroup := api.Group("/courses")
		coursesGroup.Use(middleware.AuthRequired())
		{
			coursesGroup.GET("", handlers.GetCourses)
			coursesGroup.GET("/today", handlers.GetTodayCourses)
			coursesGroup.GET("/:id", handlers.GetCourseById)
			coursesGroup.POST("", handlers.CreateCourse)
			coursesGroup.PUT("/:id", handlers.UpdateCourse)
			coursesGroup.DELETE("/:id", handlers.DeleteCourse)
		}

		// 出勤路由
		attendanceGroup := api.Group("/attendance")
		attendanceGroup.Use(middleware.AuthRequired())
		{
			attendanceGroup.GET("/upcoming", handlers.GetUpcomingCourses)
			attendanceGroup.POST("", handlers.CreateAttendance)
			attendanceGroup.PUT("/:id", handlers.UpdateAttendance)
			attendanceGroup.GET("/reminders", handlers.GetReminders)
			attendanceGroup.POST("/:id/reminders", handlers.SendReminder)
		}

		// 通知路由
		notificationGroup := api.Group("/notifications")
		notificationGroup.Use(middleware.AuthRequired())
		{
			notificationGroup.POST("/subscribe", handlers.SubscribeNotifications)
			notificationGroup.POST("/unsubscribe", handlers.UnsubscribeNotifications)
			notificationGroup.POST("/test", handlers.TestNotification)
		}

		// 文件上传路由
		uploadGroup := api.Group("/upload")
		uploadGroup.Use(middleware.AuthRequired())
		{
			uploadGroup.POST("", handlers.UploadFile)
			uploadGroup.POST("/multiple", handlers.UploadMultipleFiles)
			uploadGroup.DELETE("/:filename", handlers.DeleteFile)
		}
	}
}