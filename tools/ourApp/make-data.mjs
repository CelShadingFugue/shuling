#!/usr/bin/env node
// 从 src/model/board.js 的初始数据生成 data/board.json（CLI 与网页共用这一份）
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { INITIAL } from './src/model/board.js'

const ROOT = path.dirname(fileURLToPath(import.meta.url))
const OUT = path.join(ROOT, 'data', 'board.json')

fs.mkdirSync(path.dirname(OUT), { recursive: true })
const data = { rev: 1, groups: INITIAL.groups, tasks: INITIAL.tasks, duty: INITIAL.duty }
fs.writeFileSync(OUT, JSON.stringify(data, null, 2) + '\n', 'utf8')
console.log(`✓ ${OUT}  ${data.tasks.length} 个任务 / ${data.groups.length} 条主线`)
