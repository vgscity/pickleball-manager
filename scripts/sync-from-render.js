#!/usr/bin/env node
// Kéo dữ liệu từ Render về file backup local
// Chạy: node scripts/sync-from-render.js

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const RENDER_URL = 'https://pickleball-manager.onrender.com';
const OUTPUT = path.join(__dirname, '..', 'data-backup.json');

async function main() {
  console.log('Đang lấy dữ liệu từ Render...');
  const res = await fetch(`${RENDER_URL}/api/data`);
  if (!res.ok) throw new Error(`Lỗi: ${res.status}`);
  const data = await res.json();

  fs.writeFileSync(OUTPUT, JSON.stringify(data, null, 2), 'utf8');
  console.log(`✓ Đã lưu vào: data-backup.json`);
  console.log(`  - ${data?.players?.length ?? 0} thành viên`);
  console.log(`  - ${data?.tournaments?.length ?? 0} giải đấu`);
  console.log(`  - ${data?.matches?.length ?? 0} trận`);
  console.log(`  - ${data?.transactions?.length ?? 0} giao dịch`);
}

main().catch(err => { console.error('Lỗi:', err.message); process.exit(1); });
