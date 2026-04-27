ALTER TABLE `duty_contacts`
  ADD COLUMN `mobile_phone` VARCHAR(255) NULL AFTER `phone`,
  ADD COLUMN `landline_type` VARCHAR(32) NULL AFTER `mobile_phone`,
  ADD COLUMN `landline_phone` VARCHAR(255) NULL AFTER `landline_type`,
  ADD COLUMN `status_tag` VARCHAR(64) NULL AFTER `landline_phone`;
