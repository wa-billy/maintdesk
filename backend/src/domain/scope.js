export function scopeFor(user, params) {
  if (user.role === 'admin') return 'true';
  params.push(user.id);
  return `t.${user.role === 'technician' ? 'technician_id' : 'reporter_id'} = $${params.length}`;
}
