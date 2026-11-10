// 项目里所有“对象”的静态数据都放在这里。
// 下一轮重构会把这些搬进 model/ 变成类 + 仓储，现在先保持纯数据。

export const LINES = [
  { id: 'A', name: '硬件与结构', color: '#B5762A' },
  { id: 'B', name: '语音链路', color: '#2E6F6A' },
  { id: 'C', name: '知识库', color: '#6B5B95' },
  { id: 'D', name: '视觉与数据', color: '#3C6E9F' },
  { id: 'E', name: '系统与交付', color: '#5E7C4A' },
  { id: 'P', name: '项目管理', color: '#8A8578' },
]

export const PEOPLE = [
  { id: '1', name: '李金峰', short: '峰', color: '#B5762A' },
  { id: '2', name: '冯百懋', short: '懋', color: '#2E6F6A' },
  { id: '3', name: '张子涵', short: '涵', color: '#6B5B95' },
  { id: '4', name: '李美蓉', short: '蓉', color: '#3C6E9F' },
]

// 验收节点：纵虚线画在这个月的“月末”（也就是两列之间）
export const MILESTONES = [
  {
    id: 'M0',
    at: '2026-12',
    short: '2026.12',
    title: '第一批提交物',
    criteria: 'BOM、VAD、ASR、延迟表、仓库 README —— 5 件里先交齐能交的。',
  },
  {
    id: 'M1',
    at: '2027-02',
    short: '2027.02',
    title: '第一次验收 · 软件内核',
    criteria: '在笔记本上连演 5 轮不崩；延迟有分环节的实测数据。',
  },
  {
    id: 'M2',
    at: '2027-05',
    short: '2027.05',
    title: '第二次验收 · 实体原型',
    criteria: '装进盒子里连演 5 轮不崩；断电重启能自启；拔网线会说“我断网了”。',
  },
  {
    id: 'M3',
    at: '2027-08',
    short: '2027.08',
    title: '第三次验收 · v0.8',
    criteria: '指着课本问，3 个学习场景连演 10 分钟；试用 2–4 周，有 A/B 对比数据。',
  },
  {
    id: 'M4',
    at: '2027-11',
    short: '2027.11',
    title: '结题 · v1.0',
    criteria: '陌生人按 README 一小时装通；演示视频 + 报告 + 试用数据齐全。',
  },
]

// readme 是“这件事的细节文档”，现在统一指到分工草案，后面每件单独拆。
const DOC = 'docs/03-分工草案.md'

export const TASKS = [
  {
    id: 'A1', line: 'A', name: '选型与采购清单', start: '2026-12', end: '2027-01',
    desc: '把要买的东西、型号、价格、替代型号列成一张表；下单前先确认接口和电压对不对。',
    acceptance: 'BOM 表（含 2 个替代型号 + 价格）',
    readme: DOC,
  },
  {
    id: 'A2', line: 'A', name: '供电与接线', start: '2027-03', end: '2027-03',
    desc: '让舵机动的时候树莓派别重启；画一张“谁插谁”的接线图。',
    acceptance: '供电方案 + 接线图 + 实测不掉压',
    readme: DOC,
  },
  {
    id: 'A3', line: 'A', name: '外壳与整机装配', start: '2027-03', end: '2027-04',
    desc: '设计一个盒子把板子、屏幕、喇叭、舵机装进去，能拆能修；打印两版。',
    acceptance: '3D 文件 2 版 + 装好的整机',
    readme: DOC,
  },
  {
    id: 'A4', line: 'A', name: '稳定性测试', start: '2027-05', end: '2027-05',
    desc: '连续跑两小时、每天断电五次，记录它什么时候挂、为什么挂。',
    acceptance: '稳定性记录（含失败原因）',
    readme: DOC,
  },
  {
    id: 'B1', line: 'B', name: '麦克风与 VAD', start: '2026-12', end: '2027-01',
    desc: '判断“现在有没有人在说话”。做不好就两种结果：风扇声也触发，或者你说完了它还没听见。',
    acceptance: '能稳定触发、不误触发的录音片段',
    readme: DOC,
  },
  {
    id: 'B2', line: 'B', name: 'ASR 接入', start: '2026-12', end: '2026-12',
    desc: '把说的话变成文字，越接近“边说边出字”越好。',
    acceptance: '接通的识别服务 + 10 条测试音频结果',
    readme: DOC,
  },
  {
    id: 'B3', line: 'B', name: 'TTS 接入', start: '2026-12', end: '2027-01',
    desc: '把回答念出来。难点不是“能念”，是“念得像人、不用等三秒才出声”。',
    acceptance: '接通的合成服务 + 首包耗时',
    readme: DOC,
  },
  {
    id: 'B4', line: 'B', name: '打断与降级', start: '2027-05', end: '2027-05',
    desc: '它还在念的时候你能插话；网断了它要说“我断网了”。',
    acceptance: '打断演示 + 断网演示',
    readme: DOC,
  },
  {
    id: 'B5', line: 'B', name: '延迟打点与报告', start: '2026-12', end: '2027-02',
    desc: '给每一步记时间：采集、识别、检索、生成、合成各花多久。',
    acceptance: '延迟分解表 + 一张分解图',
    readme: DOC,
  },
  {
    id: 'C1', line: 'C', name: '教材知识点整理', start: '2026-12', end: '2027-01',
    desc: '把一章教材拆成“学生到底会怎么问”。不用写代码，但它决定系统聪不聪明。',
    acceptance: '一章知识点清单 + 30 个问答对',
    readme: DOC,
  },
  {
    id: 'C2', line: 'C', name: 'RAG 库搭建', start: '2026-12', end: '2027-01',
    desc: '让模型回答之前先查整理好的资料，而不是凭记忆胡说。',
    acceptance: '能查到的知识库 + 检索效果抽样',
    readme: DOC,
  },
  {
    id: 'C3', line: 'C', name: '教学策略与提示词', start: '2027-03', end: '2027-03',
    desc: '决定它直接给答案，还是反问一句、给个提示。',
    acceptance: '3 种策略 + 对比样例',
    readme: DOC,
  },
  {
    id: 'C4', line: 'C', name: '评测集与 badcase', start: '2026-12', end: '2027-11',
    desc: '出 20 道题当考卷，每次改完都考一遍；答错的逐条记下来。',
    acceptance: '20 题评测集 + 每周 badcase 记录',
    readme: DOC,
  },
  {
    id: 'D1', line: 'D', name: '教材页数据集', start: '2027-03', end: '2027-04',
    desc: '拍 200 张课本照片（不同角度、不同光），标出书在哪、页在哪。',
    acceptance: '200 张标注好的图',
    readme: DOC,
  },
  {
    id: 'D2', line: 'D', name: '页面 / 区域检测', start: '2027-06', end: '2027-07',
    desc: '训练一个模型，从摄像头画面里框出“书”和“这一页”。',
    acceptance: '框得对的检测模型 + 准确率',
    readme: DOC,
  },
  {
    id: 'D3', line: 'D', name: 'OCR 与指读定位', start: '2027-06', end: '2027-07',
    desc: '把框出来的那一页认成文字，再判断你手指的是哪一段。',
    acceptance: '识别结果 + 指读定位演示',
    readme: DOC,
  },
  {
    id: 'E1', line: 'E', name: '仓库与 README', start: '2026-12', end: '2026-12',
    desc: '让别人（包括三个月后的你）看懂这个项目怎么跑起来。',
    acceptance: '仓库结构 + README 初版',
    readme: DOC,
  },
  {
    id: 'E2', line: 'E', name: '一键部署', start: '2027-03', end: '2027-03',
    desc: '一条命令装好所有东西。做不到这点，“开源交付包”就是一句空话。',
    acceptance: 'install.sh + 陌生人装通记录',
    readme: DOC,
  },
  {
    id: 'E3', line: 'E', name: '开机自启 / 日志 / 演示机', start: '2027-03', end: '2027-04',
    desc: '断电重启后它自己站起来；出问题能查日志；固定一台演示机。',
    acceptance: '自启服务 + 日志规范 + 演示机镜像',
    readme: DOC,
  },
  {
    id: 'E4', line: 'E', name: '演示视频与答辩材料', start: '2027-09', end: '2027-11',
    desc: '三分钟视频，有真人、有失败、有修好；加上答辩用的图和讲稿。',
    acceptance: '演示视频 + 答辩材料',
    readme: DOC,
  },
  {
    id: 'P1', line: 'P', name: '进度与记录', start: '2026-12', end: '2027-11',
    desc: '谁在哪一条线上推进、卡在哪；记录进仓库，口头不算数。',
    acceptance: '每周一条记录',
    readme: DOC,
  },
  {
    id: 'P2', line: 'P', name: '经费与报销', start: '2026-12', end: '2027-11',
    desc: '2000 块怎么花，票据留好。',
    acceptance: '预算表 + 票据归档',
    readme: DOC,
  },
  {
    id: 'P3', line: 'P', name: '对外对接', start: '2026-12', end: '2027-11',
    desc: '跟老师、评审、实验室约时间、要资源、交材料。',
    acceptance: '会议记录 + 提交材料清单',
    readme: DOC,
  },
]

// 初始的“谁参与了什么”（2026-11-10 的现状）
export const SEED_PARTICIPATION = {
  A1: ['4'],
  B1: ['3'],
  B2: ['2'],
  B5: ['1'],
  E1: ['4'],
}
