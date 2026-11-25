const RULES = [
  { from: 'new', to: 'assigned', roles: ['admin'] },
  { from: 'assigned', to: 'in_progress', roles: ['technician'] },
  { from: 'in_progress', to: 'done', roles: ['technician'] },
  { from: 'new', to: 'cancelled', roles: ['reporter', 'admin'] },
  { from: 'assigned', to: 'cancelled', roles: ['admin'] },
];

export const canTransition = (from, to, role) =>
  RULES.some((r) => r.from === from && r.to === to && r.roles.includes(role));

export const canSetStatus = (to, role) =>
  RULES.some((r) => r.to === to && r.roles.includes(role));
