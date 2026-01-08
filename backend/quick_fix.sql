-- 快速修复：清理课程ID为3的无效合同图片路径
-- 这个SQL语句将直接清理数据库中的无效文件路径

-- 查看当前数据
SELECT id, name, contract_path, contract_images FROM courses WHERE id = 3;

-- 清理包含已删除文件名的合同图片路径
UPDATE courses 
SET contract_images = '[]' 
WHERE id = 3 
AND contract_images LIKE '%contract_2_20251223090226.png%';

-- 验证修复结果
SELECT id, name, contract_path, contract_images FROM courses WHERE id = 3;