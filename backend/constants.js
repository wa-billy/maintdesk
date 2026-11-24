export const USER_ROLE = {
  ADMIN: 'admin',
  STAFF: 'technician',
  STUDENT: 'reporter',
};

export const STATUS = {
  AVAILABLE: 'available',
  BORROWED: 'borrowed',
  REPAIR: 'repair',
  OVERDUE: 'overdue'
};

export const ERROR = {
  INVALID: (what) => [`Invalid ${what}`, 400],
  DENIED: (what) => [`${what} denied`, 401],
  FORBIDDEN: ['Invalid permission', 403]
}

export const PG_ERROR = {
  '23505': ['Resource already exists', 409],
  '23503': ['Related resource not exists', 409],
  '23502': ['A required field is missing', 400],
  '22P02': ['Invalid syntax', 400]
};

export const UPLOAD = {
  MAX_FILE: 3,
  MAX_BYTES: 5 * 1024 * 1024,
  TYPES: { 'image/jpeg': '.jpg', 'image/png': '.png', 'application/pdf': '.pdf' }
};