# 值班展示系统 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 基于 Next.js、MySQL（或 PostgreSQL）和 Node.js 服务端，完成一个移动端优先的值班展示系统第一版，包含首页、单位详情页、管理员上传页、基础数据库结构和模拟数据流。

**Architecture:** 项目采用单体全栈结构，前端页面、服务端接口和数据访问层放在同一个 Next.js 项目中。首期先使用模拟数据和可空电话字段打通完整页面与接口，再在后续迭代中接入真实 Excel 解析和导入逻辑。

**Tech Stack:** Next.js（App Router）、TypeScript、MySQL 或 PostgreSQL、ORM（Prisma 优先）、Zod、Tailwind CSS、Vitest、Playwright

---

### Task 1: 初始化仓库和工程骨架

**Files:**
- Create: `package.json`
- Create: `next.config.ts`
- Create: `tsconfig.json`
- Create: `src/app/layout.tsx`
- Create: `src/app/page.tsx`
- Create: `src/app/globals.css`
- Create: `.env.example`
- Create: `README.md`

**Step 1: 初始化 Next.js 工程**

运行项目初始化命令，生成 App Router 结构，并启用 TypeScript。

**Step 2: 配置基础依赖**

安装数据库访问、数据校验、测试和样式所需依赖。

**Step 3: 创建全局布局和全局样式**

建立移动端优先的页面容器、基础色板、字体层级和通用间距。

**Step 4: 启动开发服务器检查基础页面**

Run: `npm run dev`
Expected: 首页能正常打开，显示基础占位内容。

**Step 5: Commit**

```bash
git add .
git commit -m "chore: initialize nextjs duty roster app"
```

### Task 2: 建立数据库模型和 ORM 配置

**Files:**
- Create: `prisma/schema.prisma`
- Create: `src/lib/db.ts`
- Create: `src/lib/env.ts`
- Create: `src/lib/types/duty.ts`
- Modify: `.env.example`

**Step 1: 定义数据表模型**

在 ORM schema 中建立 `units`、`duty_overviews`、`duty_contacts`、`import_batches` 的结构，并将电话字段设计为可空。

**Step 2: 配置数据库连接**

在环境变量中补充数据库连接串和管理员上传密码。

**Step 3: 生成数据库客户端**

Run: `npx prisma generate`
Expected: ORM 客户端生成成功。

**Step 4: 创建共享类型**

定义首页摘要、详情联系人分组和上传结果的数据类型，供页面和接口共用。

**Step 5: Commit**

```bash
git add prisma/schema.prisma src/lib/db.ts src/lib/env.ts src/lib/types/duty.ts .env.example
git commit -m "feat: add database schema and shared duty types"
```

### Task 3: 准备模拟数据和查询封装

**Files:**
- Create: `src/lib/mock/duty-data.ts`
- Create: `src/lib/repositories/duty-repository.ts`
- Create: `src/lib/serializers/duty-serializer.ts`

**Step 1: 编写模拟数据**

为至少 3 个单位准备多天数据，包含首页三项摘要和详情联系人列表，并覆盖电话为空的情况。

**Step 2: 封装查询层**

提供“按日期获取首页摘要”和“按日期、单位获取详情联系人”的统一方法。

**Step 3: 对详情联系人做分组整理**

将平铺联系人记录整理为按部门名称分组的前端展示结构。

**Step 4: 编写基础单元测试**

为日期查询、单位筛选和分组逻辑编写测试。

**Step 5: Run tests**

Run: `npm run test`
Expected: 查询层与分组逻辑测试通过。

**Step 6: Commit**

```bash
git add src/lib/mock/duty-data.ts src/lib/repositories/duty-repository.ts src/lib/serializers/duty-serializer.ts
git commit -m "feat: add mock duty data and repository layer"
```

### Task 4: 实现首页页面

**Files:**
- Create: `src/components/date/date-bar.tsx`
- Create: `src/components/date/calendar-panel.tsx`
- Create: `src/components/duty/unit-overview-card.tsx`
- Create: `src/components/duty/overview-list.tsx`
- Modify: `src/app/page.tsx`

**Step 1: 实现折叠日期栏**

默认只显示当前日期摘要，点击后展开日历面板。

**Step 2: 实现单位摘要卡片**

每张卡片只展示单位名称、值班领导、值班中层、值班人员三项内容。

**Step 3: 处理电话为空状态**

对缺失电话的摘要项保留样式结构，不让页面塌陷。

**Step 4: 接入模拟查询数据**

首页根据当前日期加载当天所有单位摘要。

**Step 5: 进行手工验证**

Run: `npm run dev`
Expected: 首页在手机宽度下可正常浏览，日期栏可展开收起。

**Step 6: Commit**

```bash
git add src/components/date src/components/duty src/app/page.tsx
git commit -m "feat: build mobile-first duty overview homepage"
```

### Task 5: 实现单位详情页

**Files:**
- Create: `src/app/units/[unitId]/page.tsx`
- Create: `src/components/duty/contact-group.tsx`
- Create: `src/components/duty/contact-item.tsx`
- Create: `src/lib/formatters/phone.ts`

**Step 1: 创建详情页路由**

支持根据单位和日期参数展示某单位的完整联系人数据。

**Step 2: 实现联系人分组展示**

按部门名称分组，每个联系人条目展示部门名称、姓名、电话。

**Step 3: 为手机端预留拨号能力**

若有电话则渲染 `tel:` 链接；无电话则显示“待补充”。

**Step 4: 添加空数据状态**

当某单位某天没有详情数据时，显示明确空状态。

**Step 5: 编写页面测试**

验证联系人分组渲染和缺失电话时的显示逻辑。

**Step 6: Commit**

```bash
git add src/app/units/[unitId]/page.tsx src/components/duty/contact-group.tsx src/components/duty/contact-item.tsx src/lib/formatters/phone.ts
git commit -m "feat: add unit detail contacts page"
```

### Task 6: 实现管理员上传页和密码校验接口

**Files:**
- Create: `src/app/admin/imports/page.tsx`
- Create: `src/app/api/admin/imports/route.ts`
- Create: `src/lib/services/import-service.ts`
- Create: `src/lib/validators/import-validator.ts`

**Step 1: 实现上传页面表单**

包含密码输入、文件选择、提交按钮和结果反馈。

**Step 2: 实现服务端校验**

校验管理员密码、文件类型和基础请求结构。

**Step 3: 先返回占位导入结果**

首期不接真实 Excel 解析，只记录并返回“导入流程待实现”的结构化结果。

**Step 4: 编写接口测试**

覆盖密码正确、密码错误、文件缺失、文件格式错误场景。

**Step 5: Run tests**

Run: `npm run test`
Expected: 上传校验相关测试通过。

**Step 6: Commit**

```bash
git add src/app/admin/imports/page.tsx src/app/api/admin/imports/route.ts src/lib/services/import-service.ts src/lib/validators/import-validator.ts
git commit -m "feat: add admin import page and password validation"
```

### Task 7: 接入真实数据库读写框架

**Files:**
- Modify: `src/lib/repositories/duty-repository.ts`
- Modify: `src/lib/services/import-service.ts`
- Create: `prisma/seed.ts`

**Step 1: 保留模拟数据开关**

通过环境变量切换模拟数据模式与数据库模式，避免早期开发被数据库阻塞。

**Step 2: 实现数据库查询版本**

将首页查询和详情查询连接到 ORM 层。

**Step 3: 增加种子数据**

准备本地开发所需的演示数据，便于在无真实 Excel 的阶段进行联调。

**Step 4: 执行数据库迁移和种子脚本**

Run: `npx prisma migrate dev`
Expected: 数据库表结构创建成功。

**Step 5: Commit**

```bash
git add src/lib/repositories/duty-repository.ts src/lib/services/import-service.ts prisma/seed.ts
git commit -m "feat: connect duty flows to database layer"
```

### Task 8: 补充页面测试与联调验证

**Files:**
- Create: `tests/unit/duty-repository.test.ts`
- Create: `tests/unit/import-validator.test.ts`
- Create: `tests/e2e/homepage.spec.ts`
- Create: `tests/e2e/unit-detail.spec.ts`
- Create: `tests/e2e/admin-import.spec.ts`

**Step 1: 补齐单元测试**

覆盖查询逻辑、分组逻辑、上传校验逻辑。

**Step 2: 补齐端到端测试**

覆盖首页日期交互、详情页跳转、上传页基础流程。

**Step 3: 运行完整测试**

Run: `npm run test`
Expected: 单元测试通过。

Run: `npm run e2e`
Expected: 端到端测试通过。

**Step 4: 手工检查移动端和 PC 端布局**

确保首页与详情页在两类分辨率下可读、可点、不卡顿。

**Step 5: Commit**

```bash
git add tests
git commit -m "test: cover duty roster core flows"
```

### Task 9: 编写上线和导入适配说明

**Files:**
- Modify: `README.md`
- Create: `docs/deployment.md`
- Create: `docs/excel-import-mapping.md`

**Step 1: 补充本地开发与部署说明**

记录 Node.js 版本、数据库配置、环境变量、构建启动命令。

**Step 2: 补充 Excel 适配说明**

列出当前预期字段、真实模板待确认点和后续映射策略。

**Step 3: 补充 Git 工作流说明**

记录分支命名、提交频率、推送与 PR 建议。

**Step 4: Commit**

```bash
git add README.md docs/deployment.md docs/excel-import-mapping.md
git commit -m "docs: add deployment and import adaptation guides"
```

### Task 10: 预留 Excel 真正导入实现

**Files:**
- Modify: `src/lib/services/import-service.ts`
- Create: `src/lib/importers/excel-duty-importer.ts`
- Create: `tests/unit/excel-duty-importer.test.ts`

**Step 1: 识别真实 Excel 模板字段**

拿到最终模板后，整理首页摘要字段和详情联系人字段的映射关系。

**Step 2: 编写 Excel 解析器**

把工作表内容解析成首页摘要和详情联系人两类结构化数据。

**Step 3: 增加导入事务控制**

按批次写入数据库，保证失败可回滚。

**Step 4: 编写解析测试**

覆盖缺电话、空行、重复日期、单位不存在等典型情况。

**Step 5: Commit**

```bash
git add src/lib/services/import-service.ts src/lib/importers/excel-duty-importer.ts tests/unit/excel-duty-importer.test.ts
git commit -m "feat: implement excel duty import flow"
```
