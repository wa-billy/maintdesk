export const STATUS = {
  new: { label: 'ใหม่', icon: 'mdi-new-box', color: 'info' },
  assigned: { label: 'มอบหมายแล้ว', icon: 'mdi-account-arrow-right', color: 'primary' },
  in_progress: { label: 'กำลังซ่อม', icon: 'mdi-progress-wrench', color: 'warning' },
  done: { label: 'เสร็จแล้ว', icon: 'mdi-check-circle', color: 'success' },
  cancelled: { label: 'ยกเลิก', icon: 'mdi-cancel', color: 'grey' },
}

export const STATUS_OPTIONS = Object.entries(STATUS).map(([value, s]) => ({ value, title: s.label }))

export function ticketActions (ticket, user) {
  const owner = user?.role === 'reporter' && ticket.reporter?.id === user.id
  const technician = user?.role === 'technician' && ticket.technician?.id === user.id
  const admin = user?.role === 'admin'
  const is = (...statuses) => statuses.includes(ticket.status)
  return {
    edit: owner && is('new'),
    remove: owner && is('new'),
    assign: admin && is('new', 'assigned', 'in_progress'),
    start: technician && is('assigned'),
    repairImage: technician && is('in_progress', 'done'),
    close: technician && is('in_progress'),
    cancel: (owner && is('new')) || (admin && is('new', 'assigned')),
  }
}
