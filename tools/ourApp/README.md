# ourApp

书灵项目组的工作台。第一版只做三件事：**看时间线**、**标参与**、**看各自的负责域**。

这不是一次性的页面，是后面要长期改的软件。所以从第一天就按组件切，别写成一个大文件。

## 跑起来

```bash
pnpm install
pnpm dev      # 开发，浏览器打开 http://localhost:5173
pnpm build    # 打包成 dist/index.html，双击就能开，不用服务器
```

> 打包用的是 `vite-plugin-singlefile`，所有 JS/CSS 都内联进一个 HTML。
> 好处是发给别人直接能打开；代价是文件会比较大（现在 ~160 KB）。
> 以后要接后端/多人同步，就得换成正常的多文件构建。

## 结构

```
src/
  data/index.js          所有静态数据：主线、人、任务、验收节点、初始参与关系
  model/time.js          时间轴坐标换算 + 同一条线上的卡片避让（贪心装箱）
  model/participation.js “谁参与了什么”的状态 + localStorage 持久化
  components/Timeline.jsx      时间线：月份、主线行、卡片、验收虚线
  components/TaskDetail.jsx    卡片详情（时间线悬停 / 负责域放大，共用这一个）
  components/DutyZone.jsx      负责域：一个人参与了哪些事
  components/ParticipantPicker.jsx  四个圆点
  App.jsx                组装 + 浮层定位
```

## 现在能做什么

- 时间线上 6 条主线并行，卡片按起止月份排；同一条线上时间重叠会自动错开成子行。
- 纵向虚线是验收节点（`2026.12 / 2027.02 / 05 / 08 / 11`），上端是日期，下端是这次验收叫什么；悬停看**验收标准**。
- 卡片悬停出详情：干什么、交付物、四个圆点。
- 点圆点 = 我参与；对应的人下方负责域立刻出现这张卡。
- 负责域里的卡片悬停，右上角出删除按钮，点它退出。

## 下一轮要做的（按优先级）

1. **对象化**：现在 `TASKS` 是扁平数组，人和任务的关系是一个 `{taskId: [personId]}` 的 map。要拆成 `Task` / `Person` / `Participation` 三个类 + 一个仓储，读写在仓储里，组件不认识 localStorage。
2. **数据外置**：`data/index.js` 换成 JSON 或接口，这样改内容不用重新打包。
3. **负责人 ≠ 参与者**：现在只有一个“参与”维度。项目真正的规则是「一件提交物只有一个负责人，参与可以很多人」——负责人要单独一个字段，看板上要显示。
4. **路由**：点卡片进单页详情（`/task/A1`），而不是只有浮层。
5. **多人同步**：localStorage 只能一个人用。要么导出/导入 JSON，要么接 Supabase / GitHub 之类。

## 已知的坑

- 浮层用 `position: fixed` + `getBoundingClientRect`，所以页面一滚动就会关掉（`App.jsx` 里监听了 scroll）。改布局时注意别把滚动容器换了。
- 时间轴固定 12 个月（2026-12 → 2027-11）。改 `model/time.js` 里的 `CHART_START_*` 和 `MONTH_COUNT` 时要一起改数据里的日期。
- 「看细节」链接指向 `docs/03-分工草案.md`，打包后从 `dist/` 往上跳三级。开发模式下点不开是正常的。
