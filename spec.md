# Gr8r-style Project Workspace — 产品与技术规格说明（Spec）

> 版本：v1.0  
> 状态：Draft / Ready for implementation  
> 目标：以 [Gr8r Studio](https://github.com/gr8rstudio/gr8r-studio) 为产品交互参考，**独立实现**基于 React + TypeScript + shadcn/ui 的项目与任务管理工作台。  
> 原则：借鉴信息架构、功能和交互模式，不复制未经授权的源码、品牌或设计资产。

## 1. 背景与目标

Gr8r Studio 是使用原生 JavaScript、CSS 与 Vite 实现的项目管理演示应用，包含 Dashboard、Inbox、My Tasks、Projects、Board/List/Table/Calendar/Timeline/Files、成员、团队、活动和设置等能力。当前项目拟使用现代 React 技术栈重建类似产品，在保持界面轻量、清晰、低干扰的前提下提升可维护性、可测试性与后端扩展能力。

### 1.1 目标

1. 提供统一 Workspace Shell：侧边栏、顶部导航、项目切换、主题和响应式布局。
2. 实现项目与任务的核心 CRUD 工作流。
3. 让 Board、List、Table、Calendar、Timeline 共用同一 Task 数据源和一致的筛选/排序/分组规则。
4. 支持可访问的键盘操作、任务详情侧栏、上下文菜单与拖拽。
5. MVP 可离线使用 Mock 数据与 localStorage；通过 Repository 接口无缝切换到后端。
6. 提供严格的 TypeScript 类型、自动化测试、清晰模块边界与稳定的错误反馈。

### 1.2 非目标（MVP 不包含）

- 真实多用户实时同步、WebSocket 协作与冲突解决。
- 企业级 SSO、细粒度 RBAC、审计合规、付费计费。
- 完整甘特图依赖编辑与复杂资源排期。
- 邮件/推送通知基础设施和第三方集成。
- 大规模文件存储服务（MVP 仅本地演示数据与文件元数据）。

## 2. 用户角色与典型场景

| 角色           | 需求                                                    |
| -------------- | ------------------------------------------------------- |
| 工作区所有者   | 查看项目进度、管理项目、调整工作区偏好                  |
| 项目成员       | 新建/编辑任务、在不同视图管理任务、设置负责人及截止日期 |
| 观察者（后续） | 查看授权项目与任务，默认不做写操作                      |

核心场景：

- 从 Home 查看今日/逾期任务，并点击进入详情。
- 在项目 Board 中新增任务、拖动任务至其他状态列，状态在 List/Table/Calendar 同步更新。
- 从 List/Table 中修改优先级、负责人或截止日期，并使用筛选/排序找到目标任务。
- 在 Task Sheet 中修改标题、描述、子任务、标签并查看活动记录。
- 通过 URL 深链进入项目指定视图和任务详情；刷新后保留可持久化信息。

## 3. 范围与优先级

### P0：MVP 必须实现

- App Shell：Sidebar、Header、Breadcrumb、主题切换、桌面/移动端响应式布局。
- 路由：Home、Projects、Project Detail、My Tasks、Settings、404。
- Workspace/Project/Member/Task Mock 数据；首次访问 Seed；本地持久化与重置演示数据。
- 项目列表、项目概览与基础创建/编辑；任务新增、查看、更新、归档。
- Board（按状态列，支持列间拖拽和列内排序）与 List（筛选、排序、分组）。
- Task Sheet：标题、描述、状态、优先级、负责人、日期、标签、子任务。
- 全局任务搜索和快捷命令面板（Cmd/Ctrl+K）。
- Toast、空状态、加载状态、错误状态、键盘可操作与基本测试。

### P1：增强功能

- Table：可配置列、排序、行内编辑、批量选择。
- Calendar：月视图；任务按截止日期展示、拖动改期。
- Timeline：按开始/截止日期展示区间，支持切换周/月尺度；高级拖拽可延期。
- Inbox、Activity、Favorites、Teams/Members 页面。
- Saved Views：视图筛选、排序、分组和显示列持久化。
- 任务评论、活动历史、重复任务 UI、文件元数据列表。

### P2：服务端阶段

- 身份认证与邀请、数据库、文件上传、权限控制、真实通知、实时同步、项目/任务审计日志。

## 4. 信息架构与路由

```text
/
├── /home
├── /inbox                       (P1)
├── /my-tasks
├── /projects
│   └── /projects/:projectId
│       ├── /overview
│       ├── /board
│       ├── /list
│       ├── /table               (P1)
│       ├── /calendar            (P1)
│       ├── /timeline            (P1)
│       └── /files               (P1)
├── /members                     (P1)
├── /activity                    (P1)
└── /settings
```

- 默认 `/` 重定向到 `/home`；项目详情默认跳转 `/projects/:projectId/board`。
- 任务详情支持查询参数 `?task=<taskId>`，关闭 Sheet 移除该参数。
- 不存在的项目/任务显示可恢复的 Not Found 状态，而不是崩溃。
- UI 视图偏好可用 URL 参数（例如筛选/搜索）与本地 Saved Views 配合；必须明确两者优先级：显式 URL 参数优先。

## 5. 交互与视觉规格

### 5.1 整体布局

- 左侧 Sidebar：工作区切换、Home、Inbox、My Tasks、项目导航、Settings；桌面可折叠，移动端抽屉显示。
- 顶部 Header：Breadcrumb、页面标题/操作、全局搜索入口、用户菜单。
- 主内容区：统一横向 gutter，所有 Page Header/Toolbar/视图内容左侧对齐。
- 项目页面：标题、成员头像/项目菜单、视图 Tabs、筛选排序工具栏、当前视图。
- Task Sheet：桌面侧栏展示，窄屏采用占满屏幕的 Dialog/Sheet；ESC 关闭；保存操作反馈清晰。

### 5.2 设计 Token（初始建议，可在视觉验收中调整）

- 色彩：以中性灰为主，主要操作使用统一 accent，语义色仅用于危险、成功、警示等明确状态。
- 间距：以 4px 倍数为基础；统一 `--app-gutter`，响应式可采用 16/24/32px。
- 圆角：卡片 8–12px；弹窗/Sheet 12px；图标按钮适当更小。
- 字体：系统无衬线字体；标题、正文、辅助文字保持明确层级。
- 深浅主题：支持 light、dark、system；尊重 `prefers-reduced-motion`。
- 视觉原则：低噪声、适度留白、浅分隔线、紧凑操作栏、不滥用阴影/高饱和色。

### 5.3 主要业务交互

**Board**

- 列默认：Backlog、To Do、In Progress、Review、Done。
- 卡片展示标题、任务编号、优先级、负责人、截止日期及可选标签/子任务进度。
- 拖动到新列同时更新 `status` 与排序；列内移动只更新排序。
- 拖拽过程中显示明确落点；操作失败回滚；支持非拖拽的状态选择操作。

**List/Table**

- 公用搜索、过滤、排序、分组逻辑；字段至少支持状态、负责人、优先级、截止日期、标签。
- 筛选条件可组合，搜索匹配任务标题及任务编号。
- 任务编辑不修改其他视图的“独立副本”，必须通过统一操作入口更新。

**Task Sheet**

- 展示并可编辑：标题、描述、状态、负责人、优先级、开始日期、截止日期、标签。
- 子任务可新增、勾选完成和删除；归档前明确反馈；任务修改后其他视图即时更新。
- Sheet 打开时焦点进入面板；关闭时返回原触发位置（如触发元素仍存在）。

## 6. 技术栈

| 职责           | 选型                                                   |
| -------------- | ------------------------------------------------------ |
| 应用           | React + TypeScript + Vite                              |
| UI             | shadcn/ui + Tailwind CSS + Radix primitives            |
| 路由           | React Router                                           |
| 轻量客户端状态 | Zustand                                                |
| 异步数据与缓存 | TanStack Query                                         |
| Table          | TanStack Table                                         |
| DnD            | dnd-kit                                                |
| 日期           | date-fns                                               |
| 表单           | React Hook Form + Zod                                  |
| 图标           | lucide-react                                           |
| 提示           | Sonner                                                 |
| 测试           | Vitest + React Testing Library + Playwright            |
| 可选后端       | Node.js API + PostgreSQL + Drizzle/Prisma，或 Supabase |

版本原则：初始化时锁定兼容的稳定版本并提交 lockfile；避免在 Spec 内硬编码可能过期的次要版本。

## 7. 前端架构

采用 Feature-based Architecture，按业务边界放置逻辑，避免所有代码堆积在全局组件目录：

```text
src/
├── app/
│   ├── router.tsx
│   ├── providers.tsx
│   └── layouts/app-layout.tsx
├── components/
│   ├── ui/                       # shadcn/ui 生成组件
│   ├── layout/                   # Sidebar/Header/Breadcrumb
│   └── shared/                   # Avatar/Status/Priority 等通用组件
├── features/
│   ├── dashboard/
│   ├── projects/
│   ├── tasks/
│   │   ├── api/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── lib/                  # 筛选、排序、分组、排序计算
│   │   ├── views/                # Board/List/Table/Calendar/Timeline
│   │   └── types.ts
│   ├── inbox/
│   ├── members/
│   └── settings/
├── repositories/                 # 统一数据访问抽象
├── stores/                       # UI 状态、偏好，不复制任务实体
├── mocks/                        # Seed 数据
├── lib/                          # 通用工具
└── styles/globals.css
```

### 7.1 状态边界

1. **服务端/仓库数据**：项目、任务、成员、评论等，统一经 Repository + TanStack Query 访问；演示版 Repository 可以异步封装 localStorage。
2. **客户端 UI 状态**：Sidebar 展开、Command Dialog、临时弹窗状态等，由 Zustand/组件内部状态保存。
3. **可分享导航状态**：项目 ID、视图、打开的 Task ID、部分搜索条件，放在 URL。
4. **用户偏好**：主题、密度、视图显示列等，存入独立的 preference store；必要时持久化。
5. **派生状态**：过滤后的 Task 列表、分组和统计数，通过 selector/纯函数计算，避免作为冗余副本写回。

### 7.2 Repository 接口

```ts
export interface TaskRepository {
  list(projectId?: string): Promise<Task[]>;
  get(id: string): Promise<Task | null>;
  create(input: CreateTaskInput): Promise<Task>;
  update(id: string, patch: UpdateTaskInput): Promise<Task>;
  move(input: MoveTaskInput): Promise<Task>;
  archive(id: string): Promise<void>;
}
```

- V1 使用 `LocalTaskRepository` + Seed。未来接入 `HttpTaskRepository` 不影响业务视图组件。
- 写操作通过统一 Mutation 和失效/更新策略同步所有视图；失败时回滚乐观更新并显示 Toast。
- 所有异步操作应有可见的加载、成功和失败状态；避免静默吞错。

## 8. 数据模型

至少包含 `Workspace`、`Project`、`Member`、`Task`、`Subtask`、`Label`、`Comment`、`Attachment`、`Activity`。MVP 可将 Subtask 暂存为 Task 聚合数据，后端阶段可按需要规范化。

```ts
export type TaskStatus = "backlog" | "todo" | "in_progress" | "review" | "done";

export type TaskPriority = "none" | "low" | "medium" | "high" | "urgent";

export interface Task {
  id: string;
  key: string; // WEB-101
  projectId: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId: string | null;
  startDate: string | null; // YYYY-MM-DD
  dueDate: string | null; // YYYY-MM-DD
  labelIds: string[];
  order: number;
  archived: boolean;
  createdAt: string; // ISO datetime
  updatedAt: string;
  completedAt: string | null;
}

export interface Project {
  id: string;
  workspaceId: string;
  key: string;
  name: string;
  description: string;
  color: string;
  status: "planning" | "active" | "on_hold" | "completed";
  memberIds: string[];
  archived: boolean;
}

export interface MoveTaskInput {
  taskId: string;
  targetStatus: TaskStatus;
  beforeTaskId?: string | null;
  afterTaskId?: string | null;
}
```

约束：

- `Task.key` 在项目内唯一，创建后不随标题变化。
- 开始/截止日期使用无时区的日历日期字符串，活动时间使用带时区的 ISO 时间戳。
- 归档采用软删除；默认视图排除 `archived=true`。
- 切换任务状态为 Done 设置 `completedAt`，从 Done 移出清空该字段。
- 相同项目/状态分组中的排序应可复现；当数值 order 精度不足时自动重排。
- 将来真正实现多用户时必须在服务端校验 workspace/project/task 权限，不能信任客户端判断。

## 9. 视图引擎

视图模型示意：

```ts
export type FilterField =
  "status" | "assigneeId" | "priority" | "dueDate" | "labelIds";

export interface ViewFilter {
  field: FilterField;
  operator: "is" | "is_not";
  values: string[];
}

export interface TaskViewConfig {
  search: string;
  filters: ViewFilter[];
  sort: { field: string; direction: "asc" | "desc" };
  groupBy: "none" | "status" | "priority" | "assigneeId";
  visibleColumns?: string[];
  showCompleted: boolean;
}
```

处理顺序：`原始任务集合 → 归档/权限条件 → 搜索 → 过滤 → 排序 → 分组 → 视图渲染`。

- 计算逻辑独立在 `features/tasks/lib/view-engine.ts`，可纯函数测试。
- 不允许同一任务在多个视图中存储不同版本。
- Saved Views 的 ID/版本化格式应支持未来迁移；损坏或过期偏好回退到默认值。
- 拖拽排序优先支持状态分组下的手动排序；其他分组且当前按字段排序时，明确禁用拖拽或提示切换手动排序，避免语义不明。

## 10. 持久化策略

MVP：

- 首次进入注入确定性 Seed 数据。
- `localStorage` 保存可序列化业务数据及用户偏好，分开 Key；加入 `schemaVersion` 以支持迁移。
- 保存可 debounce，但要确保完成写入前刷新时的行为可预期；遇到存储空间限制或隐私模式失败，显示提示并维持当前内存会话。
- “重置演示数据”操作使用确认 Dialog。
- 演示版不保证跨设备共享，不宣称支持实时协作。

服务端阶段：

- 支持认证、分页、工作区权限、服务端任务操作和并发冲突处理。
- 上传文件仅在启用对象存储与受控权限后开放。

## 11. 非功能性要求

### 性能

- 初始页面避免一次性渲染所有复杂视图；Project Views 使用路由级动态加载。
- 大量任务列表（例如 1,000 条以上）引入虚拟滚动；筛选/排序通过 memoization 避免无关重算。
- Board 拖动过程保持流畅，避免整页重渲染。

### 无障碍

- 所有操作具有可理解的按钮标签和焦点状态；可用键盘访问。
- Dialog/Sheet 正确管理焦点与 ESC 关闭。
- 拖拽操作提供键盘或非拖拽替代操作。
- 不仅用颜色表达任务优先级和状态；动画尊重减少动态效果设置。

### 质量、安全

- TypeScript strict、ESLint、Prettier。
- 不将未转义的用户输入作为 HTML 注入；富文本渲染必须净化。
- 本地存储不放置密钥、访问 Token 等敏感内容。
- 错误边界和可靠的空状态；数据迁移有版本控制。
- CI 运行 lint、typecheck、unit tests、build；主要交互在 Playwright E2E 覆盖。

## 12. 验收标准（Definition of Done）

### P0 功能验收

- [ ] 启动开发服务后可打开 Home、Projects、My Tasks、Settings；直接访问深链、刷新不会丢失页面。
- [ ] 首次访问展示 Demo 工作区和多项目/多任务数据。
- [ ] 能创建项目和任务；任务可编辑标题、描述、负责人、优先级、状态、日期与标签。
- [ ] 在 Board 拖动任务到另一状态列后，新状态及相对顺序正确，刷新后保持。
- [ ] 在 List 更新任务后，Board 中立即反映变化，反之亦然。
- [ ] Task Sheet 由任务卡片或列表行打开；可用 ESC 关闭，并保留合理焦点行为。
- [ ] 搜索支持标题、任务编号；过滤、排序、分组按统一规则执行。
- [ ] 主题切换有效，桌面/窄屏布局不溢出，关键菜单可使用键盘操作。
- [ ] 异常存储状态不会导致白屏，用户可见错误和恢复入口。
- [ ] lint、typecheck、unit tests、build 通过。

### 测试用例（最低覆盖）

1. `view-engine`：搜索/多过滤组合/排除过滤/排序/分组边界。
2. `task mutations`：新增、状态更新、完成时间逻辑、归档。
3. `board dnd`：同列排序、跨列移动、空列插入、失败回滚。
4. `persistence`：首次初始化、持久化恢复、损坏数据回退、版本迁移。
5. `routing`：项目视图路由、不存在 ID、Sheet 深链。
6. `accessibility`：键盘打开/关闭 Sheet、焦点恢复、状态修改替代入口。

## 13. 实施里程碑

| 阶段 | 交付物                                             | 前置依赖 | 建议优先级 |
| ---- | -------------------------------------------------- | -------- | ---------- |
| M1   | Vite/TS/shadcn 初始化，App Shell，主题，路由，Seed | 无       | P0         |
| M2   | 数据模型、Repository、Query、Task CRUD、Task Sheet | M1       | P0         |
| M3   | Board 拖拽、List、View Engine、URL 深链、持久化    | M2       | P0         |
| M4   | Table、Saved Views、Calendar、Timeline 基础版      | M3       | P1         |
| M5   | Inbox、Members、Activity、Files、功能完善          | M3       | P1         |
| M6   | 后端、认证、权限、上传、真实通知与协作             | M3–M5    | P2         |

**MVP 发布门槛：** M1–M3 完成并通过第 12 节 P0 验收；P1/P2 不阻塞发布。

## 14. 待确认事项 / 决策记录

以下不影响按默认方案开始 M1–M3：

| 问题                             | 当前默认决策                                    |
| -------------------------------- | ----------------------------------------------- |
| 目标是像素级复刻还是独立设计？   | 参考 Gr8r 的信息架构与低噪声风格，独立视觉实现  |
| 首版是否需要服务端？             | 不需要，Mock + localStorage                     |
| 是否需要登录？                   | MVP 无真实登录，保留 UI/接口扩展位              |
| 初版多视图范围？                 | Board + List 必做；Table/Calendar/Timeline 分期 |
| 文件、评论、通知是否真实持久化？ | MVP 不作为阻塞项，P1/P2 分期实现                |
| 优先支持哪些终端？               | 桌面优先，同时保证移动端基础可用                |

## 15. 开发工作约定

- 每个 Feature 至少包含独立 UI、类型、数据访问/操作入口；跨 Feature 复用抽到 `components/shared` 或 `lib`。
- shadcn/ui 的底层生成组件放在 `components/ui`，原则上少改底层，多在业务组件封装。
- 单一 Task 数据源；不要在 Zustand、Query 和各视图分别存一份完整任务数据。
- 实现功能前先确认数据契约与状态流；先测试纯业务算法，再补 UI。
- 完成一个里程碑即保证可运行、可导航、可回归测试，而不是积累大量未连接的静态页面。

---

### 参考资源

- 原项目：[gr8rstudio/gr8r-studio](https://github.com/gr8rstudio/gr8r-studio)
- 原项目 README：[README.md](https://github.com/gr8rstudio/gr8r-studio/blob/main/README.md)
- UI 基础：[shadcn/ui](https://ui.shadcn.com/)
- 拖拽：[dnd-kit](https://dndkit.com/)
- 表格：[TanStack Table](https://tanstack.com/table)
- 异步状态：[TanStack Query](https://tanstack.com/query)
