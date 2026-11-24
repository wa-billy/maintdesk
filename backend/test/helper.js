process.env.DB_HOST ??= 'localhost';
process.env.DB_USER ??= 'test';
process.env.DB_PASSWORD ??= 'test';
process.env.DB_NAME ??= 'test';
process.env.JWT_SECRET ??= 'test-secret';

export async function startApp() {
  const { app } = await import('../src/app.js');
  const server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  return { url: `http://127.0.0.1:${server.address().port}`, close: () => server.close() };
}