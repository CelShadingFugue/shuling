# ourApp

书灵项目组的工作台。v0.2 —— 时间线可编辑、可缩放、可多选。

## 跑起来

```bash
pnpm install
pnpm dev      # 开发，http://localhost:5173
pnpm build    # 打包成 dist/index.html，双击就能开
```

> 打包用 `vite-plugin-singlefile`，JS/CSS 全内联进一个 HTML，方便发给别人。
> 代价是文件大（~180 KB），而且只能单机用——同步还没做。

## 现在能做什么

| 交互 | 怎么操作 |
|---|---|
| 缩放 | `Ctrl + 滚轮`，7 级：年 / 半年 / 季 / 月 / 半月 / 周 / 日 |
| 横移 | `Shift + 滚轮`；普通滚轮是页面纵向滚动 |
| 看细节 | 卡片悬停 |
| 改归属 | 卡片详情里点圆点（参与者） |
| 拖动任务 | 按住左键直接拖（超过 3px 起拖）；卡片跟手走，松手才吸附刻度 |
| 改时长 | 拖卡片右边缘 |
| 锁定一条 | 卡片悬停，右上角出现图钉，点一下锁/解锁（锁了不能拖、不能改时长） |
| 批量锁定 | 选中多条，底部浮条上一个图钉键：全锁 / 全解锁 |
| 新建 | 行头悬停出现 `＋`；或在空白处用粘贴 |
| 折叠主任务 | 行头悬停出现 `‹` |
| 排序主任务 | 行头 `▲▼`，主任务锁定后不可移动 |
| 时间点 | 在月份下面那条细带里点一下 = 新建；按住拖动 = 跟手落位；Ctrl+拖动 = 横向框选 |
| 多选 | `Ctrl + 拖框`，或 `Ctrl + 点卡片` |
| 批量 | 底部浮条：锁定 / 解锁 / 参与者 / 颜色 / 删除 |
| 复制粘贴 | `Ctrl+C` 复制选中，鼠标移到目标主任务上 `Ctrl+V` |
| 删除 | 选中后按 `Delete` 或 `Backspace`，`Ctrl+Z` 撤销 |
| 取消选择 | 点时间线上没有卡片的地方，或 `Esc` |
| 主题 | 设置里切：纸白 / 夜间 / 投影 |

锁定（pin）的语义：**锁时间，不锁行**。所以空行压缩永远优先于 pin，不会出现"锁定了一个任务组就永远占着空行"。


## 命令行（CLI）

给不想用鼠标的时候用，改的是 `data/board.json`——和网页同一份结构。

```bash
node make-data.mjs          # 从 src/model/board.js 重新生成 data/board.json

node cli.mjs list           # 所有任务
node cli.mjs groups         # 所有主线
node cli.mjs show A1        # 一个任务的详情

node cli.mjs task add --group D --name "标注第一批" --start 2027-03-02 --end 2027-03-16
node cli.mjs task set A2 --start 2027-03-05 --color c4 --pin
node cli.mjs task rm A2

node cli.mjs group set A --name "硬件" --color "#B5762A" --collapse
node cli.mjs group move A up

node cli.mjs mark ls                     # 时间点
node cli.mjs mark add --at 2027-03-15T18:00 --name "中期检查"
node cli.mjs mark set M2 --at 2027-06-01 --name "第二次验收"
node cli.mjs mark rm M3

node cli.mjs duty A2 +2 +3   # 给 A2 加 2、3 号成员
node cli.mjs who 2           # 2 号参与了什么（负责域）
node cli.mjs check           # 检查：悬空任务、结束早于开始、同行时间重叠
```

**网页和 CLI 怎么连起来**：设置面板里有「导出 / 导入」。网页导出 `board.json` → 放进
`tools/ourApp/data/` → CLI 改 → 网页再导入。`rev` 每次写入 +1，方便以后接 git 同步时对账。

## 结构

```
src/
  data/            （已并入 model/board.js 的 TASKS）
  model/
    time.js        刻度体系：7 级、吸附、刻度生成、周序数
    board.js       数据 + 纯操作（增删改、分轨、压缩、复制粘贴）
    notes.js       每个任务的说明与交付文案（跟结构分开）
    colors.js      卡片色 token、主题列表
    tint.js        #RRGGBB → rgba
  state/useBoard.js  唯一写入口 commit()，快照式撤销，localStorage
  components/
    Timeline.jsx   时间线：刻度、网格、行、卡片、拖拽、框选、复制粘贴
    TaskDetail.jsx 详情卡（时间线悬停 / 负责域共用）
    DutyZone.jsx   负责域
    BatchBar.jsx   批量操作条
    Toolbar.jsx    顶栏 + 设置
  styles.css       全部样式 + 主题变量
```

## 和设计文档的差异（v0.2 实现时的简化）

| 设计（05/06） | 现在 | 为什么 |
|---|---|---|
| 一对象一文件 + rev | 整体一个 board 存 localStorage | 同步还没做，先跑通交互 |
| Command + 逆操作 | 快照式撤销 | 对象小，快照最不容易错；接同步时再换 |
| DutyArea 单独存边 | `board.duty[taskId] = [memberId]` | 等价，先放一起 |
| 交付物单独对象 | 文案在 `notes.js` | 还没有状态流转，先不做 |
| 周序数标注在周一 | 已实现（月/季/半月视图） | — |

## 还没做（下一轮）

1. 卡片详情里直接切 pin（现在只能悬停卡片右上角或批量条）。
2. 组的折叠状态**进配置文件**（你定的：折叠要同步），现在只在内存里。
3. 同步：GitHub 仓库 + 配置文件（重要共享设置进 git，主题等外观不进）。
4. 拖拽时把子任务拖出组 → 换组（现在只能用剪切粘贴）。
5. 日视图的 6 小时刻度对齐（现在能显示，但标签密度还要调）。

## 已知问题

- 时间线横向滚动和页面纵向滚动共用一个滚轮：目前靠浏览器滚动链（滚到横向边界就传给页面），在触控板上会有点跳。
- 浮层用 `position: fixed`，页面一滚动就关，改布局时注意。
- `CHART_START` 固定为 2026-11-01，改它要同步改 `board.js` 里的任务日期。
