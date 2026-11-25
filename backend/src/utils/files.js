import fs from 'node:fs/promises';
import path from 'node:path';

export const removeFile = (name) =>
  name && fs.unlink(path.join(process.env.UPLOAD_DIR || 'uploads', name)).catch(() => {});
