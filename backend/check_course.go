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
	
	var course models.Course
	if err := database.DB.Where("id = ?", 3).First(&course).Error; err != nil {
		log.Fatal("获取课程失败:", err)
	}
	
	fmt.Printf("当前课程数据:\n")
	fmt.Printf("课程ID: %d\n", course.ID)
	fmt.Printf("课程名称: %s\n", course.Name)
	fmt.Printf("合同路径: %s\n", course.ContractPath)
	fmt.Printf("合同图片: %s\n", course.ContractImages)
	
	if course.ContractImages != "" {
		var images []string
		if err := json.Unmarshal([]byte(course.ContractImages), &images); err != nil {
			fmt.Printf("解析合同图片JSON失败: %v\n", err)
		} else {
			fmt.Printf("合同图片数量: %d\n", len(images))
			for i, img := range images {
				fmt.Printf("图片%d: %s\n", i+1, img)
			}
		}
	}
}