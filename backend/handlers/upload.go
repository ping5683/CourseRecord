package handlers

import (
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"course-management-backend/utils"

	"github.com/gin-gonic/gin"
)

// UploadFile 单文件上传
func UploadFile(c *gin.Context) {
	userID := c.GetUint("userID")
	
	// 获取上传的文件
	file, err := c.FormFile("file")
	if err != nil {
		utils.Error(c, http.StatusBadRequest, "请选择要上传的文件")
		return
	}

	result, err := saveSingleFile(file, userID)
	if err != nil {
		utils.Error(c, http.StatusInternalServerError, err.Error())
		return
	}

	utils.Success(c, "上传成功", result)
}

// UploadMultipleFiles 多文件上传
func UploadMultipleFiles(c *gin.Context) {
	// 检查用户认证
	userIDInterface, exists := c.Get("userID")
	if !exists {
		utils.Error(c, http.StatusUnauthorized, "用户未认证")
		return
	}
	
	userID, ok := userIDInterface.(uint)
	if !ok {
		utils.Error(c, http.StatusUnauthorized, "用户ID无效")
		return
	}
	
	// 确保上传目录存在
	uploadDir := "./uploads/contracts"
	if err := os.MkdirAll(uploadDir, 0755); err != nil {
		utils.Error(c, http.StatusInternalServerError, "创建上传目录失败")
		return
	}
	
	// 获取上传的文件列表
	form, err := c.MultipartForm()
	if err != nil {
		utils.Error(c, http.StatusBadRequest, "请选择要上传的文件")
		return
	}
	
	files := form.File["files"]
	if len(files) == 0 {
		utils.Error(c, http.StatusBadRequest, "请选择要上传的文件")
		return
	}

	// 限制最大文件数量
	if len(files) > 20 {
		utils.Error(c, http.StatusBadRequest, "一次最多上传20个文件")
		return
	}

	var results []gin.H
	var errors []string

	for _, file := range files {
		// 验证文件大小 (最大10MB)
		if file.Size > 10*1024*1024 {
			errors = append(errors, fmt.Sprintf("文件 %s 大小超过10MB限制", file.Filename))
			continue
		}

		// 验证文件类型
		allowedTypes := map[string]bool{
			".pdf":  true,
			".doc":  true,
			".docx": true,
			".jpg":  true,
			".jpeg": true,
			".png":  true,
		}
		
		ext := strings.ToLower(filepath.Ext(file.Filename))
		if !allowedTypes[ext] {
			errors = append(errors, fmt.Sprintf("文件 %s 类型不支持", file.Filename))
			continue
		}

		result, err := saveSingleFile(file, userID)
		if err != nil {
			errors = append(errors, fmt.Sprintf("文件 %s 上传失败: %s", file.Filename, err.Error()))
		} else {
			results = append(results, gin.H{
				"filename": result["filename"],
				"path":     result["path"],
				"url":      result["url"],
				"originalName": file.Filename,
			})
		}
	}

	response := gin.H{
		"success": len(results) > 0,
		"uploaded": results,
		"errors":   errors,
		"total":    len(files),
		"successCount": len(results),
		"errorCount":   len(errors),
	}

	if len(errors) > 0 && len(results) == 0 {
		utils.Error(c, http.StatusBadRequest, fmt.Sprintf("所有文件上传失败: %s", strings.Join(errors, "; "))) 
		return
	}

	utils.Success(c, fmt.Sprintf("上传完成，成功 %d 个，失败 %d 个", len(results), len(errors)), response)
}

// saveSingleFile 保存单个文件的通用函数
func saveSingleFile(file *multipart.FileHeader, userID uint) (gin.H, error) {
	// 生成文件名（使用纳秒级时间戳确保唯一性）
	timestamp := time.Now().Format("20060102150405.999999999")
	// 清理时间戳中的小数点，替换为下划线
	timestamp = strings.Replace(timestamp, ".", "_", -1)
	ext := strings.ToLower(filepath.Ext(file.Filename))
	newFilename := fmt.Sprintf("contract_%d_%s%s", userID, timestamp, ext)
	
	// 创建上传目录
	uploadDir := "./uploads/contracts"
	if err := os.MkdirAll(uploadDir, 0755); err != nil {
		return nil, fmt.Errorf("创建上传目录失败")
	}

	// 检查文件是否已存在，如果存在则添加后缀
	filePath := filepath.Join(uploadDir, newFilename)
	counter := 1
	for {
		if _, err := os.Stat(filePath); os.IsNotExist(err) {
			break
		}
		// 文件已存在，添加后缀
		baseName := strings.TrimSuffix(newFilename, ext)
		newFilename = fmt.Sprintf("%s_%d%s", baseName, counter, ext)
		filePath = filepath.Join(uploadDir, newFilename)
		counter++
		
		// 防止无限循环
		if counter > 1000 {
			return nil, fmt.Errorf("无法生成唯一的文件名")
		}
	}

	// 保存文件
	dst, err := os.Create(filePath)
	if err != nil {
		return nil, fmt.Errorf("创建文件失败")
	}
	defer dst.Close()
	
	src, err := file.Open()
	if err != nil {
		return nil, fmt.Errorf("打开上传文件失败")
	}
	defer src.Close()
	
	if _, err := io.Copy(dst, src); err != nil {
		return nil, fmt.Errorf("文件保存失败")
	}

	// 返回文件路径
	url := fmt.Sprintf("/uploads/contracts/%s", newFilename)
	
	return gin.H{
		"filename": newFilename,
		"path":     filePath,
		"url":      url,
	}, nil
}

// DeleteFile 删除文件
func DeleteFile(c *gin.Context) {
	filename := c.Param("filename")
	if filename == "" {
		utils.Error(c, http.StatusBadRequest, "文件名不能为空")
		return
	}

	// 防止目录遍历攻击
	if strings.Contains(filename, "..") || strings.Contains(filename, "/") || strings.Contains(filename, "\\") {
		utils.Error(c, http.StatusBadRequest, "无效的文件名")
		return
	}

	filePath := filepath.Join("./uploads/contracts", filename)
	
	// 检查文件是否存在
	if _, err := os.Stat(filePath); os.IsNotExist(err) {
		utils.Error(c, http.StatusNotFound, "文件不存在")
		return
	}

	// 删除文件
	if err := os.Remove(filePath); err != nil {
		utils.Error(c, http.StatusInternalServerError, "删除文件失败")
		return
	}

	utils.Success(c, "删除成功", nil)
}

// DeleteFileAndUpdateCourse 删除文件并更新课程记录
func DeleteFileAndUpdateCourse(c *gin.Context) {
	filename := c.Param("filename")
	courseID := c.Param("courseId")
	
	if filename == "" || courseID == "" {
		utils.Error(c, http.StatusBadRequest, "文件名和课程ID不能为空")
		return
	}

	// 防止目录遍历攻击
	if strings.Contains(filename, "..") || strings.Contains(filename, "/") || strings.Contains(filename, "\\") {
		utils.Error(c, http.StatusBadRequest, "无效的文件名")
		return
	}

	filePath := filepath.Join("./uploads/contracts", filename)
	
	// 检查文件是否存在
	if _, err := os.Stat(filePath); os.IsNotExist(err) {
		utils.Error(c, http.StatusNotFound, "文件不存在")
		return
	}

	// 删除文件
	if err := os.Remove(filePath); err != nil {
		utils.Error(c, http.StatusInternalServerError, "删除文件失败")
		return
	}

	// 更新课程记录，清除相关文件路径
	// 这里需要调用课程相关的服务来更新数据库
	// 由于课程更新逻辑在课程处理器中，这里只返回成功
	// 前端需要负责调用课程更新接口来清理文件路径

	utils.Success(c, "删除成功", nil)
}

// 辅助函数：验证文件是否为图像
func isImageFile(file *multipart.FileHeader) bool {
	ext := strings.ToLower(filepath.Ext(file.Filename))
	imageExtensions := []string{".jpg", ".jpeg", ".png", ".gif", ".bmp"}
	
	for _, extType := range imageExtensions {
		if ext == extType {
			return true
		}
	}
	return false
}

// 辅助函数：验证文件是否为文档
func isDocumentFile(file *multipart.FileHeader) bool {
	ext := strings.ToLower(filepath.Ext(file.Filename))
	documentExtensions := []string{".pdf", ".doc", ".docx", ".txt"}
	
	for _, extType := range documentExtensions {
		if ext == extType {
			return true
		}
	}
	return false
}