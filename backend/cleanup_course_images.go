package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"

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

	// 清理contractImages字段，只保留有效的数据
	var images []string
	if contractImages != "" && contractImages != "null" && contractImages != "[]" {
		if err := json.Unmarshal([]byte(contractImages), &images); err != nil {
			fmt.Printf("解析contractImages失败: %v\n", err)
			// 如果解析失败，设置为空数组
			images = []string{}
		}
	}

	// 如果contractPath不为空，确保它也在contractImages中
	if contractPath != "" {
		found := false
		for _, img := range images {
			if img == contractPath {
				found = true
				break
			}
		}
		if !found {
			// 将contractPath添加到images数组的开头
			images = append([]string{contractPath}, images...)
			fmt.Printf("将contractPath添加到contractImages中\n")
		}
	}

	// 将清理后的数据更新回数据库
	var updatedImagesJSON string
	if len(images) > 0 {
		imagesJSON, err := json.Marshal(images)
		if err != nil {
			log.Fatal("JSON序列化失败:", err)
		}
		updatedImagesJSON = string(imagesJSON)
	} else {
		updatedImagesJSON = "[]"
	}

	// 更新数据库
	_, err = db.Exec("UPDATE courses SET contract_images = ? WHERE id = 3", updatedImagesJSON)
	if err != nil {
		log.Fatal("更新数据库失败:", err)
	}

	fmt.Printf("清理后数据:\n")
	fmt.Printf("contractImages: '%s'\n", updatedImagesJSON)
	fmt.Printf("\n数据库更新完成！\n")
}