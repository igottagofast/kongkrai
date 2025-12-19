CREATE SCHEMA kongkrai;

CREATE TABLE menus (
    menu_id 		INT			PRIMARY KEY AUTO_INCREMENT,
    menu_name 		VARCHAR(64) NOT NULL,
    menu_category	VARCHAR(64) NOT NULL
);

CREATE TABLE customers (
    customer_id 	INT 		PRIMARY KEY AUTO_INCREMENT,
    customer_name 	VARCHAR(64) NOT NULL,
    customer_tel 	VARCHAR(10) NOT NULL
);

CREATE TABLE orders (
    order_id 		INT			PRIMARY KEY AUTO_INCREMENT,
	customer_id 	INT 		NOT NULL,
    order_time 		DATETIME 	NOT NULL,
    order_status 	ENUM('pending', 'cooking', 'done', 'cancel') NOT NULL,
    
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id)
);

CREATE TABLE order_items (
    item_id             INT PRIMARY KEY AUTO_INCREMENT,
    order_id            INT NOT NULL,
    menu_id             INT,
	item_name			VARCHAR(256),
    item_detail			VARCHAR(256),
	item_ware			ENUM('plate', 'box') NOT NULL,
    item_quantity		INT NOT NULL DEFAULT 1,
    

    FOREIGN KEY (order_id) REFERENCES orders(order_id),
    FOREIGN KEY (menu_id) REFERENCES menus(menu_id)
);

CREATE TABLE queues(
	order_id 	INT 	PRIMARY KEY,
    queue_no 	INT 	NOT NULL,
    queue_date 	DATE 	NOT NULL DEFAULT (CURRENT_DATE),
    
	FOREIGN KEY (order_id) REFERENCES orders(order_id)
);

