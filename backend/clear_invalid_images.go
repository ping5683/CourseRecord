package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"os"

	_ "github.com/go-sql-driver/mysql"
)

func main() {
	// 初始化数据库连接
	db, err := sql.Open("mysql", "root:123456@tcp(localhost:3306)/course_management")
	if err != nil {
		log.Fatal("数据库连接失败:", err)
	}
	defer db.Close()

	// 查询课程ID为3的数据
	var contractPath, contractImages string
	err = db.QueryRow("SELECT contract_path, contract_images FROM courses WHERE id = 3").Scan(&contractPath, &contractImages)
	if err != nil {
		log.Fatal("查询失败:", err)
	}

	fmt.Printf("清理前数据:\n")
	fmt.Printf("contractPath: '%s'\n", contractPath)
	fmt.Printf("contractImages: '%s'\n\n", contractImages)

	// 检查并清理无效的图片路径
	var validImages []string
	var images []string
	
	// 解析contractImages
	if contractImages != "" && contractImages != "null" && contractImages != "[]" {
		if err := json.Unmarshal([]byte(contractImages), &images); err != nil {
			fmt.Printf("解析contractImages失败: %v\n", err)
			images = []string{}
		}
	}

	// 检查每个图片文件是否存在
	for _, imgPath := range images {
		if fileExists(imgPath) {
			validImages = append(validImages, imgPath)
			fmt.Printf("✅ 保留有效图片: %s\n", imgPath)
		} else {
			fmt.Printf("❌ 删除无效图片: %s\n", imgPath)
		}
	}

	// 检查contractPath
	if contractPath != "" && !fileExists(contractPath) {
		fmt.Printf("❌ contractPath文件不存在，清空: %s\n", contractPath)
		contractPath = ""
	}

	// 更新数据库
	var updatedImagesJSON string
	if len(validImages) > 0 {
		imagesJSON, err := json.Marshal(validImages)
		if err != nil {
			log.Fatal("JSON序列化失败:", err)
		}
		updatedImagesJSON = string(imagesJSON)
	} else {
		updatedImagesJSON = "[]"
	}

	// 更新数据库
	_, err = db.Exec("UPDATE courses SET contract_path = ?, contract_images = ? WHERE id = 3", contractPath, updatedImagesJSON)
	if err != nil {
		log.Fatal("更新数据库失败:", err)
	}

	fmt.Printf("\n清理后数据:\n")
	fmt.Printf("contractPath: '%s'\n", contractPath)
	fmt.Printf("contractImages: '%s'\n", updatedImagesJSON)
	fmt.Printf("\n数据库清理完成！\n")
}

func fileExists(filePath string) bool {
	// 去掉开头的斜杠
	if filePath[0] == '/' {
		filePath = filePath[1:]
	}
	
	if _, err := os.Stat(filePath); os.IsNotExist(err) {
		return false
	}
	return true
}