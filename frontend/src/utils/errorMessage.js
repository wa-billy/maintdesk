const MESSAGES = {
  401: 'หมดเวลาการใช้งาน กรุณาเข้าสู่ระบบใหม่',
  403: 'คุณไม่มีสิทธิ์ทำรายการนี้',
  404: 'ไม่พบข้อมูลที่ต้องการ',
  413: 'ไฟล์มีขนาดเกิน 5 MB',
  500: 'เกิดข้อผิดพลาดในระบบ กรุณาลองใหม่ภายหลัง',
}

export function errorMessage (error) {
  const res = error.response
  if (!res?.data?.status) return 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ กรุณาลองใหม่'
  const backendMessage = typeof res.data?.message === 'string' ? res.data.message : null
  if ([409, 415].includes(res.status) && backendMessage) return backendMessage
  return MESSAGES[res.status] ?? (res.status < 500 ? backendMessage : null) ?? MESSAGES[500]
}
