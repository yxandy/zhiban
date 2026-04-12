# 值班系统

这是值班展示系统的第一阶段工程骨架，当前目标是先打通本地运行能力，而不是立即进入业务页面开发。

## 当前已具备

- `Next.js + TypeScript` 基础工程
- `Prisma + MySQL` 数据库配置骨架
- 远程局域网 MySQL 的环境变量接入方式
- 本地首页占位页
- 数据库健康检查接口：`/api/health/db`
- 基础单元测试

## 环境要求

- Node.js `20.9+`
- npm
- 可访问的局域网 MySQL

## 本地启动

1. 复制环境变量模板

```bash
copy .env.example .env
```

2. 修改 `.env` 中的配置

```env
DATABASE_URL="mysql://用户名:密码@192.168.1.100:3306/zhiban?charset=utf8mb4"
ADMIN_IMPORT_PASSWORD="请替换为实际密码"
USE_MOCK_DATA="true"
```

3. 安装依赖

```bash
npm install
```

4. 启动开发服务器

```bash
npm run dev
```

5. 打开浏览器访问

```text
http://localhost:3000
```

## 验证方式

### 模拟数据模式

- 设置 `USE_MOCK_DATA="true"`
- 访问首页查看工程骨架状态
- 访问 `http://localhost:3000/api/health/db`
- 接口应返回模拟模式说明，不实际探测数据库

### 数据库模式

- 设置 `USE_MOCK_DATA="false"`
- 保证局域网 MySQL 可从本机访问
- 再访问 `http://localhost:3000/api/health/db`
- 接口应返回数据库连接成功或失败信息

## 下一步

后续开发会在这个骨架上继续补充：

- 首页值班摘要页面
- 单位详情页
- 管理员上传页
- 模拟数据查询层
- 真实 Excel 导入逻辑
