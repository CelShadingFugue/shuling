#!/usr/bin/env node
// 打包，然后把 dist/index.html 改名成 dist/ourApp.html —— 发给别人时就发这一个文件。
import fs from 'node:fs'
import { build } from 'vite'

await build()

const from = 'dist/index.html'
const to = 'dist/ourApp.html'
if (fs.existsSync(from)) {
  fs.rmSync(to, { force: true })
  fs.renameSync(from, to)
  console.log('→ dist/ourApp.html')
}
