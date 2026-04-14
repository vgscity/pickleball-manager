#!/usr/bin/env node
// Kéo dữ liệu từ Render về local server
// Chạy: node scripts/sync-from-render.js <admin-password>

const RENDER_URL = 'https://pickleball-manager.onrender.com';
const LOCAL_URL = 'http://localhost:3001';

async function main() {
  const password = process.argv[2];
  if (!password) {
    console.error('Dùng: node scripts/sync-from-render.js <mật-khẩu-admin>');
    process.exit(1);
  }

  console.log('1. Lấy dữ liệu từ Render...');
  const dataRes = await fetch(`${RENDER_URL}/api/data`);
  if (!dataRes.ok) throw new Error(`Lỗi lấy data: ${dataRes.status}`);
  const data = await dataRes.json();
  console.log('   ✓ Lấy data thành công');

  console.log('2. Đăng nhập local...');
  const loginRes = await fetch(`${LOCAL_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  });
  if (!loginRes.ok) throw new Error('Đăng nhập local thất bại — sai mật khẩu?');
  const { token } = await loginRes.json();
  console.log('   ✓ Đăng nhập thành công');

  console.log('3. Ghi dữ liệu vào local...');
  const putRes = await fetch(`${LOCAL_URL}/api/data`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(data),
  });
  if (!putRes.ok) throw new Error(`Lỗi ghi data: ${putRes.status}`);
  console.log('   ✓ Đồng bộ hoàn tất!');
}

main().catch(err => { console.error('Lỗi:', err.message); process.exit(1); });
