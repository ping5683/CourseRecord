package main

import (
	"course-management-backend/database"
	"course-management-backend/models"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"strings"
)

func main() {
	// 初始化数据库
	if err := database.InitDatabase(); err != nil {
		log.Fatal("数据库初始化失败:", err)
	}
	defer database.CloseDatabase()

	// 获取所有课程
	var courses []models.Course
	if err := database.DB.Find(&courses).Error; err != nil {
		log.Fatal("获取课程失败:", err)
	}

	fmt.Printf("开始检查 %d 个课程的合同文件...\n", len(courses))

	for i, course := range courses {
		fmt.Printf("\n检查课程 %d/%d: ID=%d, 名称=%s\n", i+1, len(courses), course.ID, course.Name)
		
		// 检查主合同文件
		if course.ContractPath != "" {
			if !fileExists(course.ContractPath) {
				fmt.Printf("  ❌ 主合同文件不存在: %s\n", course.ContractPath)
				fmt.Printf("    清理主合同路径...\n")
				course.ContractPath = ""
			} else {
				fmt.Printf("  ✅ 主合同文件存在: %s\n", course.ContractPath)
			}
		}

		// 检查合同图片
		if course.ContractImages != "" {
			var images []string
			if err := json.Unmarshal([]byte(course.ContractImages), &images); err != nil {
				fmt.Printf("  ⚠️ 合同图片JSON解析失败: %v\n", err)
			} else {
				var validImages []string
				for _, imgPath := range images {
					if imgPath != "" {
						if fileExists(imgPath) {
							fmt.Printf("  ✅ 合同图片存在: %s\n", imgPath)
							validImages = append(validImages, imgPath)
						} else {
							fmt.Printf("  ❌ 合同图片不存在: %s\n", imgPath)
						}
					}
				}
				
				// 更新有效的图片路径
				if len(validImages) != len(images) {
					fmt.Printf("    清理无效的图片路径...\n")
					updatedImagesJSON, _ := json.Marshal(validImages)
					course.ContractImages = string(updatedImagesJSON)
				}
			}
		}

		// 如果有变更，更新数据库
		if course.ContractPath == "" && course.ContractImages == "[]" {
			fmt.Printf("  ℹ️  课程无有效的合同文件，跳过更新\n")
			continue
		}

		// 更新课程记录
		if err := database.DB.Save(&course).Error; err != nil {
			fmt.Printf("  ❌ 更新课程失败: %v\n", err)
		} else {
			fmt.Printf("  ✅ 课程记录已更新\n")
		}
	}

	fmt.Printf("\n清理完成!\n")
}

// fileExists 检查文件是否存在
func fileExists(filePath string) bool {
	// 去除URL前缀，获取本地路径
	localPath := strings.TrimPrefix(filePath, "/uploads")
	localPath = "./uploads" + localPath
	
	_, err := os.Stat(localPath)
	return err == nil
}