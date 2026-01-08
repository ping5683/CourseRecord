-- 重置课程ID为3的合同图片数据
UPDATE courses SET 
    contract_path = '',
    contract_images = '[]'
WHERE id = 3;

-- 验证更新结果
SELECT id, name, contract_path, contract_images FROM courses WHERE id = 3;