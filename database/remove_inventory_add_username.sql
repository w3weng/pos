SET FOREIGN_KEY_CHECKS=0;

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS username VARCHAR(50) NULL AFTER name;

UPDATE users
SET username = LOWER(CONCAT(SUBSTRING_INDEX(email, '@', 1), id))
WHERE username IS NULL OR username = '';

ALTER TABLE users
    MODIFY username VARCHAR(50) NOT NULL;

CREATE UNIQUE INDEX unique_username ON users (username);

DROP TABLE IF EXISTS inventory_logs;

ALTER TABLE products
    DROP COLUMN IF EXISTS quantity_in_stock,
    DROP COLUMN IF EXISTS reorder_level;

SET FOREIGN_KEY_CHECKS=1;
