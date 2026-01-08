package main

import (
	"database/sql"
	"fmt"
	"log"
	"os"

	_ "github.com/go-sql-driver/mysql"
)

func main() {
	// 数据库连接信息
	dsn := "root:@tcp(localhost:3306)/course_management?charset=utf8mb4&parseTime=True&loc=Local"
	
	// 连接数据库
	db, err := sql.Open("mysql", dsn)
	if err != nil {
		log.Fatal("数据库连接失败:", err)
	}
	defer db.Close()

	// 测试连接
	err = db.Ping()
	if err != nil {
		log.Fatal("数据库连接测试失败:", err)
	}

	// 查询课程数据
	var id int
	var name string
	var contractImages string
	
	err = db.QueryRow("SELECT id, name, contract_images FROM courses WHERE id = 3").Scan(&id, &name, &contractImages)
	if err != nil {
		log.Fatal("查询失败:", err)
	}

	fmt.Printf("课程ID: %d\n", id)
	fmt.Printf("课程名称: %s\n", name)
	fmt.Printf("合同图片数据: %s\n", contractImages)
	
	// 检查contract_images字段是否为空
	if contractImages == "" {
		fmt.Println("⚠️ contract_images字段为空！")
	} else {
		fmt.Println("✅ contract_images字段有数据")
	}
}