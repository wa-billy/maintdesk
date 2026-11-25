INSERT INTO users (username, password_hash, full_name, role) VALUES
  ('admin', '$2b$10$zMECqxi9mftX/0k9VyIMZeIJLlAgrsT5x9oYoVWhFHGukqFBhH8we', 'ผู้ดูแลระบบ', 'admin'),
  ('tech1', '$2b$10$zMECqxi9mftX/0k9VyIMZeIJLlAgrsT5x9oYoVWhFHGukqFBhH8we', 'ช่างวิทย์', 'technician'),
  ('tech2', '$2b$10$zMECqxi9mftX/0k9VyIMZeIJLlAgrsT5x9oYoVWhFHGukqFBhH8we', 'ช่างสมศักดิ์', 'technician'),
  ('reporter1', '$2b$10$zMECqxi9mftX/0k9VyIMZeIJLlAgrsT5x9oYoVWhFHGukqFBhH8we', 'สมชาย ใจดี', 'reporter'),
  ('reporter2', '$2b$10$zMECqxi9mftX/0k9VyIMZeIJLlAgrsT5x9oYoVWhFHGukqFBhH8we', 'สุดา รักงาน', 'reporter');

INSERT INTO categories (name) VALUES
  ('ไฟฟ้า'), ('ประปา'), ('เครื่องปรับอากาศ'), ('คอมพิวเตอร์');

INSERT INTO tickets (title, description, location, status, category_id, reporter_id, technician_id, repair_cost, repair_image_path, created_at, updated_at, resolved_at)
SELECT v.title, v.description, v.location, v.status, c.id, r.id, tech.id, v.repair_cost, v.repair_image_path,now() - v.created::interval, now() - v.updated::interval, now() - v.resolved::interval
FROM (VALUES
  ('แอร์ไม่เย็น', 'เปิดแล้วมีแต่ลม', 'อาคาร 2 ห้อง 204', 'done', 'เครื่องปรับอากาศ', 'reporter1', 'tech1', 1500.00, 'seed-repair-01.jpg', '10 days', '9 days', '9 days'),
  ('หลอดไฟห้องประชุมดับ', 'หลอดไฟดับ 2 ดวง', 'อาคาร 1 ห้องประชุม 1', 'done', 'ไฟฟ้า', 'reporter2', 'tech2', 250.00, 'seed-repair-02.jpg', '9 days', '8 days 20 hours', '8 days 20 hours'),
  ('ก๊อกน้ำรั่ว', 'น้ำหยดตลอดเวลา', 'อาคาร 3 ห้องน้ำชั้น 2', 'done', 'ประปา', 'reporter1', 'tech1', NULL, 'seed-repair-03.jpg', '8 days', '7 days', '7 days'),
  ('คอมพิวเตอร์เปิดไม่ติด', 'กดปุ่มแล้วไม่มีไฟเข้า', 'อาคาร 1 ห้อง 105', 'in_progress', 'คอมพิวเตอร์', 'reporter2', 'tech2', NULL, NULL, '6 days', '5 days', NULL),
  ('ปลั๊กไฟชำรุด', 'ปลั๊กหลวม เสียบแล้วมีประกายไฟ', 'อาคาร 2 ห้อง 210', 'in_progress', 'ไฟฟ้า', 'reporter1', 'tech1', NULL, NULL, '5 days', '4 days', NULL),
  ('ท่อน้ำทิ้งอุดตัน', 'น้ำระบายช้า มีกลิ่น', 'อาคาร 3 โรงอาหาร', 'assigned', 'ประปา', 'reporter2', 'tech1', NULL, NULL, '4 days', '3 days', NULL),
  ('แอร์มีน้ำหยด', 'น้ำหยดจากตัวเครื่องลงพื้น', 'อาคาร 1 ห้อง 302', 'assigned', 'เครื่องปรับอากาศ', 'reporter1', 'tech2', NULL, NULL, '3 days', '2 days', NULL),
  ('เครื่องพิมพ์กระดาษติด', 'กระดาษติดทุกครั้งที่พิมพ์', 'อาคาร 2 ห้องธุรการ', 'cancelled', 'คอมพิวเตอร์', 'reporter2', 'tech2', NULL, NULL, '7 days', '6 days', NULL),
  ('พัดลมเพดานไม่หมุน', 'เปิดสวิตช์แล้วไม่หมุน', 'อาคาร 1 ห้อง 201', 'cancelled', 'ไฟฟ้า', 'reporter1', NULL, NULL, NULL, '2 days', '1 day 20 hours', NULL),
  ('Wi-Fi ใช้งานไม่ได้', 'เชื่อมต่อได้แต่เข้าเว็บไม่ได้', 'อาคาร 3 ห้อง 301', 'new', 'คอมพิวเตอร์', 'reporter1', NULL, NULL, NULL, '1 day', '1 day', NULL),
  ('ชักโครกกดไม่ลง', 'ปุ่มกดค้าง', 'อาคาร 2 ห้องน้ำชั้น 1', 'new', 'ประปา', 'reporter2', NULL, NULL, NULL, '12 hours', '12 hours', NULL),
  ('แอร์มีเสียงดัง', 'มีเสียงดังตอนเปิดเครื่อง', 'อาคาร 1 ห้อง 104', 'new', 'เครื่องปรับอากาศ', 'reporter2', NULL, NULL, NULL, '2 hours', '2 hours', NULL)
) AS v (title, description, location, status, category, reporter, technician, repair_cost, repair_image_path, created, updated, resolved)
JOIN categories c ON c.name = v.category
JOIN users r ON r.username = v.reporter
LEFT JOIN users tech ON tech.username = v.technician
ORDER BY v.created::interval DESC;

INSERT INTO ticket_logs (ticket_id, actor_id, from_status, to_status, note, created_at)
SELECT t.id, u.id, v.from_status, v.to_status, v.note, now() - v.ago::interval
FROM (VALUES
  ('แอร์ไม่เย็น', 'reporter1', NULL, 'new', NULL, '10 days'),
  ('แอร์ไม่เย็น', 'admin', 'new', 'assigned', NULL, '9 days 22 hours'),
  ('แอร์ไม่เย็น', 'tech1', 'assigned', 'in_progress', NULL, '9 days 20 hours'),
  ('แอร์ไม่เย็น', 'tech1', 'in_progress', 'done', 'เติมน้ำยาแอร์', '9 days'),
  ('หลอดไฟห้องประชุมดับ', 'reporter2', NULL, 'new', NULL, '9 days'),
  ('หลอดไฟห้องประชุมดับ', 'admin', 'new', 'assigned', NULL, '8 days 23 hours'),
  ('หลอดไฟห้องประชุมดับ', 'tech2', 'assigned', 'in_progress', NULL, '8 days 22 hours'),
  ('หลอดไฟห้องประชุมดับ', 'tech2', 'in_progress', 'done', 'เปลี่ยนหลอด LED', '8 days 20 hours'),
  ('ก๊อกน้ำรั่ว', 'reporter1', NULL, 'new', NULL, '8 days'),
  ('ก๊อกน้ำรั่ว', 'admin', 'new', 'assigned', NULL, '7 days 20 hours'),
  ('ก๊อกน้ำรั่ว', 'tech1', 'assigned', 'in_progress', NULL, '7 days 6 hours'),
  ('ก๊อกน้ำรั่ว', 'tech1', 'in_progress', 'done', 'เปลี่ยนซีลยาง', '7 days'),
  ('คอมพิวเตอร์เปิดไม่ติด', 'reporter2', NULL, 'new', NULL, '6 days'),
  ('คอมพิวเตอร์เปิดไม่ติด', 'admin', 'new', 'assigned', NULL, '5 days 20 hours'),
  ('คอมพิวเตอร์เปิดไม่ติด', 'tech2', 'assigned', 'in_progress', NULL, '5 days'),
  ('ปลั๊กไฟชำรุด', 'reporter1', NULL, 'new', NULL, '5 days'),
  ('ปลั๊กไฟชำรุด', 'admin', 'new', 'assigned', NULL, '4 days 22 hours'),
  ('ปลั๊กไฟชำรุด', 'tech1', 'assigned', 'in_progress', NULL, '4 days'),
  ('ท่อน้ำทิ้งอุดตัน', 'reporter2', NULL, 'new', NULL, '4 days'),
  ('ท่อน้ำทิ้งอุดตัน', 'admin', 'new', 'assigned', NULL, '3 days'),
  ('แอร์มีน้ำหยด', 'reporter1', NULL, 'new', NULL, '3 days'),
  ('แอร์มีน้ำหยด', 'admin', 'new', 'assigned', NULL, '2 days'),
  ('เครื่องพิมพ์กระดาษติด', 'reporter2', NULL, 'new', NULL, '7 days'),
  ('เครื่องพิมพ์กระดาษติด', 'admin', 'new', 'assigned', NULL, '6 days 20 hours'),
  ('เครื่องพิมพ์กระดาษติด', 'admin', 'assigned', 'cancelled', 'เปลี่ยนเครื่องใหม่แทน', '6 days'),
  ('พัดลมเพดานไม่หมุน', 'reporter1', NULL, 'new', NULL, '2 days'),
  ('พัดลมเพดานไม่หมุน', 'reporter1', 'new', 'cancelled', 'แจ้งผิดห้อง', '1 day 20 hours'),
  ('Wi-Fi ใช้งานไม่ได้', 'reporter1', NULL, 'new', NULL, '1 day'),
  ('ชักโครกกดไม่ลง', 'reporter2', NULL, 'new', NULL, '12 hours'),
  ('แอร์มีเสียงดัง', 'reporter2', NULL, 'new', NULL, '2 hours')
) AS v (title, actor, from_status, to_status, note, ago)
JOIN tickets t ON t.title = v.title
JOIN users u ON u.username = v.actor
ORDER BY v.ago::interval DESC;
