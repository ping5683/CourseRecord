package middleware

import (
	"net/http"
	"strings"
	"course-management-backend/database"
	"course-management-backend/models"
	"course-management-backend/utils"

	"github.com/gin-gonic/gin"
)

// AuthRequired 认证中间件
func AuthRequired() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{
				"success": false,
				"message": "访问被拒绝，请提供有效的token",
			})
			c.Abort()
			return
		}

		// 提取Bearer token
		tokenString := strings.TrimPrefix(authHeader, "Bearer ")
		if tokenString == authHeader {
			c.JSON(http.StatusUnauthorized, gin.H{
				"success": false,
				"message": "无效的token格式",
			})
			c.Abort()
			return
		}

		// 验证token
		claims, err := utils.ValidateJWT(tokenString)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{
				"success": false,
				"message": "Token无效",
			})
			c.Abort()
			return
		}

		// 查找用户
		var user models.User
		if err := database.GetDB().First(&user, claims.UserID).Error; err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{
				"success": false,
				"message": "用户不存在",
			})
			c.Abort()
			return
		}

		// 将用户信息存储到上下文
		c.Set("user", &user)
		c.Set("userID", user.ID)
		c.Next()
	}
}