package main

import (
	"course-management-backend/database"
	"course-management-backend/models"
	"encoding/json"
	"fmt"
	"log"
)

func main() {
	if err := database.InitDatabase(); err != nil {
		log.Fatal("数据库初始化失败:", err)
	}
	defer database.CloseDatabase()
	
	// 获取课程ID为3的数据
	var course models.Course
	if err := database.DB.Where("id = ?", 3).First(&course).Error; err != nil {
		log.Fatal("获取课程失败:", err)
	}
	
	fmt.Printf("=== 课程详细信息 ===\n")
	fmt.Printf("课程ID: %d\n", course.ID)
	fmt.Printf("课程名称: %s\n", course.Name)
	fmt.Printf("contractPath: '%s' (长度: %d)\n", course.ContractPath, len(course.ContractPath))
	fmt.Printf("contractImages: '%s'\n", course.ContractImages)
	
	// 解析contractImages
	if course.ContractImages != "" {
		var images []string
		if err := json.Unmarshal([]byte(course.ContractImages), &images); err != nil {
			fmt.Printf("解析contractImages失败: %v\n", err)
		} else {
			fmt.Printf("contractImages包含图片数量: %d\n", len(images))
			for i, img := range images {
				fmt.Printf("  图片%d: %s\n", i+1, img)
			}
		}
	}
	
	fmt.Printf("\n=== 数据库清理命令 ===\n")
	fmt.Printf("清理contract_images字段:\n")
	fmt.Printf("UPDATE courses SET contract_images = '[]' WHERE id = 3;\n")
	fmt.Printf("\n清理contract_path字段:\n")
	fmt.Printf("UPDATE courses SET contract_path = '' WHERE id = 3;\n")
	
	fmt.Printf("\n=== 同时清理两个字段 ===\n")
	fmt.Printf("UPDATE courses SET contract_path = '', contract_images = '[]' WHERE id = 3;\n")
}