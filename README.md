# 值班展示系统（zhiban）

移动端优先的值班信息展示系统，面向普通用户提供首页摘要与单位详情，面向管理员提供 Excel 导入能力。

## 当前功能

1. 首页值班摘要（`/`）
- 顶部折叠日期栏，支持展开月历。
- 支持切换日期、返回当天、切换年份和月份。
- 单位名称和右侧箭头都可点击进入详情页。
- 摘要行按“姓名左、电话右”展示。

2. 单位详情页（`/units/[unitSlug]?date=YYYY-MM-DD`）
- 标题显示“单位名值班详情”。
- 分组展示联系人列表。
- 联系人行按“姓名左、电话右”展示。
- 有电话可直接拨号；无电话显示“电话未上传”。

3. 管理员导入页（`/admin/imports`）
- 支持上传一级/二级 Excel。
- 支持两种模式：
  - `dry-run`：仅解析，不写库。
  - `commit`：解析并写入数据库。
- 返回导入统计、差异单位、告警信息，`commit` 模式会返回导入批次 ID。

4. 后端接口
- `POST /api/admin/imports`：管理员导入接口（支持 `dry-run` / `commit`）。
- `GET /api/health/db`：数据库健康检查。

## 技术栈

- Next.js + TypeScript
- Prisma + MySQL
- Tailwind CSS
- Vitest + Testing Library
- xlsx（Excel 解析）

## 环境要求

- Node.js `20.9+`
- npm
- 可访问的 MySQL（本地或局域网）

## 环境变量

先复制：

```bash
copy .env.example .env
```

再配置：

```env
DATABASE_URL="mysql://用户名:密码@IP:3306/zhiban?charset=utf8mb4"
ADMIN_IMPORT_PASSWORD="管理员上传密码"
USE_MOCK_DATA="true"
```

说明：
- `USE_MOCK_DATA="true"`：默认使用模拟数据。
- `USE_MOCK_DATA="false"`：前台优先读数据库（无数据时会回退模拟数据）。

## 安装与运行

```bash
npm install
npm run dev
```

访问：

- 首页：`http://localhost:3000`
- 上传页：`http://localhost:3000/admin/imports`
- 健康检查：`http://localhost:3000/api/health/db`

## 数据库初始化

请先执行建表 SQL（已整理在以下文档）：

- `docs/deployment.md`

然后用上传页 `commit` 模式导入真实 Excel，即可在前台查看数据库数据。

## 测试

```bash
npm test
```

当前项目已覆盖首页、详情页、导入服务、导入接口、上传页面等核心单测。
