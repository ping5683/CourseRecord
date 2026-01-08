-- 修复课程ID为3的无效文件路径
-- 首先检查当前数据
SELECT id, name, contract_path, contract_images FROM courses WHERE id = 3;

-- 清理无效的合同图片路径
UPDATE courses 
SET contract_images = '[]' 
WHERE id = 3 
AND contract_images LIKE '%contract_2_20251223090226.png%';

-- 验证修复结果
SELECT id, name, contract_path, contract_images FROM courses WHERE id = 3;