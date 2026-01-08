package handlers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

// HealthCheck 健康检查
func HealthCheck(c *gin.Context) {
	response := gin.H{
		"status":    "OK",
		"timestamp": time.Now().UTC().Format(time.RFC3339),
		"uptime":    time.Since(startTime).Seconds(),
	}
	
	c.JSON(http.StatusOK, response)
}

// startTime 服务启动时间
var startTime = time.Now()