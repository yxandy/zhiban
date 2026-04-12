# 部署与建表说明（MySQL）

更新时间：2026-04-12

本文提供当前项目可直接执行的 MySQL 建表 SQL，用于本地/测试库初始化。

## 1. 适用范围

- 适用于当前仓库 `prisma/schema.prisma` 对应的数据结构。
- 适用于 MySQL 8.x（推荐）。
- 字符集统一为 `utf8mb4`。

## 2. 执行前确认

1. 先确认当前数据库连接信息（`DATABASE_URL`）指向测试库，不要误连生产库。
2. 若目标库已存在同名表且有历史数据，请先备份，再决定是否执行建表脚本。

## 3. 建表 SQL（可直接执行）

```sql
-- 建议先选中数据库
-- USE your_database_name;

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE IF NOT EXISTS `units` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `code` VARCHAR(255) NULL,
  `sort_order` INT NOT NULL DEFAULT 0,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `units_code_key` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `import_batches` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `file_name` VARCHAR(255) NOT NULL,
  `storage_path` VARCHAR(255) NULL,
  `import_status` VARCHAR(191) NOT NULL DEFAULT 'pending',
  `error_message` TEXT NULL,
  `imported_at` DATETIME(3) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `duty_overviews` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `duty_date` DATETIME(3) NOT NULL,
  `unit_id` INT NOT NULL,
  `leader_name` VARCHAR(255) NULL,
  `leader_phone` VARCHAR(255) NULL,
  `middle_manager_name` VARCHAR(255) NULL,
  `middle_manager_phone` VARCHAR(255) NULL,
  `staff_name` VARCHAR(255) NULL,
  `staff_phone` VARCHAR(255) NULL,
  `source_batch_id` INT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `duty_overviews_duty_date_unit_id_idx` (`duty_date`, `unit_id`),
  KEY `duty_overviews_source_batch_id_idx` (`source_batch_id`),
  CONSTRAINT `duty_overviews_unit_id_fkey`
    FOREIGN KEY (`unit_id`) REFERENCES `units`(`id`)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `duty_overviews_source_batch_id_fkey`
    FOREIGN KEY (`source_batch_id`) REFERENCES `import_batches`(`id`)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `duty_contacts` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `duty_date` DATETIME(3) NOT NULL,
  `unit_id` INT NOT NULL,
  `department_name` VARCHAR(255) NOT NULL,
  `person_name` VARCHAR(255) NOT NULL,
  `phone` VARCHAR(255) NULL,
  `sort_order` INT NOT NULL DEFAULT 0,
  `source_batch_id` INT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `duty_contacts_duty_date_unit_id_department_name_idx` (`duty_date`, `unit_id`, `department_name`),
  KEY `duty_contacts_source_batch_id_idx` (`source_batch_id`),
  CONSTRAINT `duty_contacts_unit_id_fkey`
    FOREIGN KEY (`unit_id`) REFERENCES `units`(`id`)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `duty_contacts_source_batch_id_fkey`
    FOREIGN KEY (`source_batch_id`) REFERENCES `import_batches`(`id`)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

SET FOREIGN_KEY_CHECKS = 1;
```

## 4. 建表后自检 SQL

```sql
SHOW TABLES;

DESC units;
DESC import_batches;
DESC duty_overviews;
DESC duty_contacts;
```

## 5. 下一步联调建议

1. 先在页面 `http://localhost:3000/admin/imports` 继续走 dry-run，确认解析统计稳定。
2. 你完成建表后，我这边可以继续把 `import-service` 扩展为“可写库模式”，把解析结果写入 `import_batches / duty_overviews / duty_contacts` 并做事务控制。
