package main

import (
	"course-management-backend/database"
	"course-management-backend/models"
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
	
	fmt.Printf("清理前数据:\n")
	fmt.Printf("课程ID: %d\n", course.ID)
	fmt.Printf("课程名称: %s\n", course.Name)
	fmt.Printf("合同路径: %s\n", course.ContractPath)
	fmt.Printf("合同图片JSON: %s\n", course.ContractImages)
	
	// 清理合同路径和合同图片
	course.ContractPath = ""
	course.ContractImages = "[]"
	
	// 保存更新
	if err := database.DB.Save(&course).Error; err != nil {
		log.Fatal("更新课程失败:", err)
	}
	
	fmt.Printf("\n清理后数据:\n")
	fmt.Printf("合同路径: %s\n", course.ContractPath)
	fmt.Printf("合同图片JSON: %s\n", course.ContractImages)
	fmt.Printf("\n数据库已清理完成!\n")
}