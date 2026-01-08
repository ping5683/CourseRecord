package main

import (
	"database/sql"
	"fmt"
	"log"

	_ "github.com/go-sql-driver/mysql"
)\n
func main() {
	// 连接数据库
	db, err := sql.Open("mysql", "root:123456@tcp(localhost:3306)/course_management")
	if err != nil {
		log.Fatal("数据库连接失败:", err)
	}
	defer db.Close()

	// 检查courses表结构
	rows, err := db.Query(`
		SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT 
		FROM INFORMATION_SCHEMA.COLUMNS 
		WHERE TABLE_SCHEMA = 'course_management' 
		AND TABLE_NAME = 'courses'
		ORDER BY ORDINAL_POSITION
	`)
	if err != nil {
		log.Fatal("查询表结构失败:", err)
	}
	defer rows.Close()

	fmt.Println("courses表结构:")
	fmt.Println("========================================")
	
	for rows.Next() {
		var columnName, dataType, isNullable, columnDefault sql.NullString
		err := rows.Scan(&columnName, &dataType, &isNullable, &columnDefault)
		if err != nil {
			log.Fatal("读取行失败:", err)
		}
		
		fmt.Printf("字段名: %-20s 类型: %-15s 可为空: %-5s 默认值: %s\n", 
			columnName.String, dataType.String, isNullable.String, columnDefault.String)
	}
	
	// 检查是否有contractImages和contract_images字段
	fmt.Println("\n检查合同相关字段:")
	fmt.Println("========================================")
	
	var contractImagesExists, contractImages2Exists bool
	
	// 检查contractImages字段
	var count int
	err = db.QueryRow(`
		SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
		WHERE TABLE_SCHEMA = 'course_management' 
		AND TABLE_NAME = 'courses' 
		AND COLUMN_NAME = 'contractImages'
	`).Scan(&count)
	if err != nil {
		log.Fatal("查询字段是否存在失败:", err)
	}
	contractImagesExists = count > 0
	
	// 检查contract_images字段
	err = db.QueryRow(`
		SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
		WHERE TABLE_SCHEMA = 'course_management' 
		AND TABLE_NAME = 'courses' 
		AND COLUMN_NAME = 'contract_images'
	`).Scan(&count)
	if err != nil {
		log.Fatal("查询字段是否存在失败:", err)
	}
	contractImages2Exists = count > 0
	
	fmt.Printf("contractImages字段存在: %v\n", contractImagesExists)
	fmt.Printf("contract_images字段存在: %v\n", contractImages2Exists)
	
	if contractImagesExists && contractImages2Exists {
		fmt.Println("\n警告: 两个字段都存在，需要删除其中一个！")
	}
}