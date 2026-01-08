package handlers

import (
	"net/http"
	"course-management-backend/database"
	"course-management-backend/models"
	"course-management-backend/utils"

	"github.com/gin-gonic/gin"
)

// Register 用户注册
func Register(c *gin.Context) {
	var req struct {
		Username string `json:"username" binding:"required,min=3,max=50"`
		Password string `json:"password" binding:"required,min=6"`
		Email    string `json:"email" binding:"omitempty,email"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationError(c, err.Error())
		return
	}

	db := database.GetDB()

	// 检查用户名是否已存在
	var existingUser models.User
	if err := db.Where("username = ?", req.Username).First(&existingUser).Error; err == nil {
		utils.Error(c, http.StatusBadRequest, "用户名已存在")
		return
	}

	// 创建用户
	user := models.User{
		Username: req.Username,
		Password: req.Password, // 会在BeforeCreate钩子中加密
		Email:    req.Email,
	}

	if err := db.Create(&user).Error; err != nil {
		utils.Error(c, http.StatusInternalServerError, "注册失败")
		return
	}

	// 生成JWT
	token, err := utils.GenerateJWT(user.ID)
	if err != nil {
		utils.Error(c, http.StatusInternalServerError, "生成token失败")
		return
	}

	utils.Success(c, "注册成功", gin.H{
		"user":  user.ToResponse(),
		"token": token,
	})
}

// Login 用户登录
func Login(c *gin.Context) {
	var req struct {
		Username string `json:"username" binding:"required"`
		Password string `json:"password" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationError(c, err.Error())
		return
	}

	db := database.GetDB()

	// 查找用户
	var user models.User
	if err := db.Where("username = ?", req.Username).First(&user).Error; err != nil {
		utils.Error(c, http.StatusUnauthorized, "用户名或密码错误")
		return
	}

	// 验证密码
	if !user.ValidatePassword(req.Password) {
		utils.Error(c, http.StatusUnauthorized, "用户名或密码错误")
		return
	}

	// 生成JWT
	token, err := utils.GenerateJWT(user.ID)
	if err != nil {
		utils.Error(c, http.StatusInternalServerError, "生成token失败")
		return
	}

	utils.Success(c, "登录成功", gin.H{
		"user":  user.ToResponse(),
		"token": token,
	})
}

// GetProfile 获取当前用户信息
func GetProfile(c *gin.Context) {
	user, _ := c.Get("user")
	utils.Success(c, "获取成功", gin.H{
		"user": user.(*models.User).ToResponse(),
	})
}