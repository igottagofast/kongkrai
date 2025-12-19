select * from menus;
select * from customers;
select * from orders;
select * from order_items;
select * from queues;

delete from customers where customer_id = 2;

INSERT INTO orders (customer_id, order_time, order_status) VALUES (5, NOW(), 'pending');


drop table menus, customers, orders, order_items, queues;

UPDATE orders SET order_status = "cancel" WHERE order_id = 13;