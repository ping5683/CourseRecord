package main

import (
	"course-management-backend/database"
	"course-management-backend/models"
	"encoding/json"
	"fmt"
	"log"
	"strings"
)

func main() {
	// 初始化数据库
	if err := database.InitDatabase(); err != nil {
		log.Fatal("数据库初始化失败:", err)
	}
	defer database.CloseDatabase()

	// 修复课程ID为3的数据
	var course models.Course
	if err := database.DB.Where("id = ?", 3).First(&course).Error; err != nil {
		log.Fatal("获取课程失败:", err)
	}

	fmt.Printf("当前课程数据:\n")
	fmt.Printf("课程ID: %d\n", course.ID)
	fmt.Printf("课程名称: %s\n", course.Name)
	fmt.Printf("合同路径: %s\n", course.ContractPath)
	fmt.Printf("合同图片: %s\n", course.ContractImages)

	// 检查并清理无效的合同图片路径
	if course.ContractImages != "" {
		var images []string
		if err := json.Unmarshal([]byte(course.ContractImages), &images); err != nil {
			fmt.Printf("解析合同图片JSON失败: %v\n", err)
		} else {
			var validImages []string
			for _, imgPath := range images {
				// 如果路径包含已删除的文件名，则跳过
				if !strings.Contains(imgPath, "contract_2_20251223090226.png") {
					validImages = append(validImages, imgPath)
				} else {
					fmt.Printf("移除无效图片路径: %s\n", imgPath)
				}
			}

			// 更新合同图片数据
			updatedImagesJSON, _ := json.Marshal(validImages)
			course.ContractImages = string(updatedImagesJSON)

			// 保存更新
			if err := database.DB.Save(&course).Error; err != nil {
				log.Fatal("更新课程失败:", err)
			}

			fmt.Printf("课程数据已更新!\n")
			fmt.Printf("新的合同图片数据: %s\n", course.ContractImages)
		}
	}

	fmt.Printf("修复完成!\n")
}