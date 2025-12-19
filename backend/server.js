const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// connect database
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "aimlnwza007",
  database: "kongkrai",
});

db.connect((err) => {
  if (err) {
    console.log("DB error:", err);
    return;
  }
  console.log("MySQL connected!");
});

// GET menus
app.get("/menus", (req, res) => {
  db.query("SELECT * FROM menus", (err, result) => {
    if (err) return res.send(err);
    res.json(result);
  });
});

// get queues
app.get("/queues", (req, res) => {
  const sql = `
  SELECT q.queue_no, c.customer_name, c.customer_tel, o.order_status 
  FROM queues q 
  JOIN orders o USING(order_id)
  JOIN customers c USING(customer_id)
  WHERE q.queue_date = CURDATE()
  ORDER BY q.queue_no ASC 
  `;

  db.query(sql, (err, result) => {
    if (err) {
      console.log("Queue Query Error:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json(result);
  });
});

// get order item
app.get("/order-items/:queueNo", (req, res) => {
  const queueNo = req.params.queueNo;

  const sql = `
    SELECT 
      oi.item_id,
      oi.item_name, 
      oi.item_detail,
      oi.item_ware, 
      oi.item_quantity,
      o.order_status
    FROM queues q
    JOIN orders o USING(order_id)
    JOIN order_items oi USING(order_id)
    WHERE q.queue_no = ? and q.queue_date = CURDATE()
  `;

  db.query(sql, [queueNo], (err, result) => {
    if (err) return res.status(500).send(err);
    res.json(result);
  });
});

// get waiting ORDERS TODAY
app.get("/active-orders-count", (req, res) => {
  const sql = `
    SELECT COUNT(*) AS active_orders
    FROM orders
    WHERE DATE(order_time) = CURDATE()
    AND order_status NOT IN ('cancel', 'done')
  `;

  db.query(sql, (err, result) => {
    if (err) {
      console.log("Count Query Error:", err);
      return res.status(500).json({ error: "Database error" });
    }

    res.json({
      active_orders: result[0].active_orders,
    });
  });
});

// create order api
app.post("/order", (req, res) => {
  const { customer_name, customer_tel, items } = req.body;

  // 1) Insert customer
  db.query(
    "INSERT INTO customers (customer_name, customer_tel) VALUES (?, ?)",
    [customer_name, customer_tel],
    (err, cusResult) => {
      if (err) return res.send(err);

      const customer_id = cusResult.insertId;
      console.log("step1: customer done");

      // 2) Insert order
      db.query(
        "INSERT INTO orders (customer_id, order_time, order_status) VALUES (?, NOW(), 'pending')",
        [customer_id],
        (err, orderResult) => {
          if (err) return res.send(err);

          const order_id = orderResult.insertId;
          console.log("step2: order done");

          // 3) Insert order_items (bulk insert)
          const values = items.map((item) => [
            order_id,
            item.menu_id,
            item.name,
            item.detail,
            item.ware,
            item.quantity,
          ]);

          db.query(
            "INSERT INTO order_items (order_id, menu_id, item_name, item_detail, item_ware, item_quantity) VALUES ?",
            [values],
            (err) => {
              if (err) return res.status(500).send(err);
              console.log("step3: order items done");

              // 4) find queue number
              db.query(
                "SELECT MAX(queue_no) AS last_queue FROM queues WHERE queue_date = CURRENT_DATE",
                (err, result) => {
                  if (err) return res.send(err);

                  let queue_no =
                    result[0].last_queue !== null
                      ? result[0].last_queue + 1
                      : 1;

                  console.log("step4.1: find latest queue of the day done");

                  // 5) Insert queue
                  db.query(
                    "INSERT INTO queues (order_id, queue_no) VALUES (?, ?)",
                    [order_id, queue_no],
                    (err) => {
                      if (err) return res.send(err);
                      console.log("step4.2: queue done");

                      // FINAL RESPONSE — ส่งครั้งเดียวเท่านั้น
                      return res.json({
                        customer_id,
                        order_id,
                        queue_no,
                        message: "Order created successfully!",
                      });
                    }
                  );
                }
              );
            }
          );
        }
      );
    }
  );
});

// =============================
//  UPDATE ORDER ITEMS (Edit Page)
// =============================
app.post("/update-order-items", (req, res) => {
  const { queueNo, items } = req.body;

  if (!queueNo || !items) {
    return res.status(400).json({ error: "Missing queueNo or items" });
  }

  // 1) หาว่า queueNo นี้มี order_id อะไร
  const getOrderIdQuery = `
    SELECT order_id 
    FROM queues 
    WHERE queue_no = ? AND queue_date = CURDATE()
  `;

  db.query(getOrderIdQuery, [queueNo], (err, result) => {
    if (err) return res.status(500).json(err);
    if (result.length === 0) {
      return res.status(404).json({ error: "Queue not found" });
    }

    const orderId = result[0].order_id;

    // 2) โหลดรายการ order_items ทั้งหมด
    const getItemsQuery = `
      SELECT item_id FROM order_items 
      WHERE order_id = ? 
      ORDER BY item_id ASC
    `;

    db.query(getItemsQuery, [orderId], (err2, rows) => {
      if (err2) return res.status(500).json(err2);

      if (rows.length !== items.length) {
        return res.status(400).json({
          error: "Number of items from DB does not match frontend data",
        });
      }

      // 3) UPDATE ทีละ item
      const updateQuery = `
        UPDATE order_items
        SET item_name = ?, item_detail = ?, item_quantity = ?, item_ware = ?
        WHERE item_id = ?
      `;

      let doneCount = 0;

      items.forEach((item, index) => {
        const itemId = rows[index].item_id;

        db.query(
          updateQuery,
          [item.name, item.detail, item.quantity, item.ware, itemId],
          (err3) => {
            if (err3) console.log("Update item failed:", err3);

            doneCount++;
            if (doneCount === items.length) {
              return res.json({
                message: "Order items updated successfully!",
              });
            }
          }
        );
      });
    });
  });
});

// =============================
//  DELETE ONE ORDER ITEM
// =============================
app.delete("/order-item/:itemId", (req, res) => {
  const itemId = req.params.itemId;

  if (!itemId) {
    return res.status(400).json({ error: "Missing itemId" });
  }

  // query check if exits
  const checkQuery = `SELECT * FROM order_items WHERE item_id = ?`;

  db.query(checkQuery, [itemId], (err, rows) => {
    if (err) return res.status(500).json(err);

    if (rows.length === 0) {
      return res.status(404).json({ error: "Item not found" });
    }

    // ลบ item จริง
    const deleteQuery = `DELETE FROM order_items WHERE item_id = ?`;

    db.query(deleteQuery, [itemId], (err2) => {
      if (err2) return res.status(500).json(err2);

      return res.json({
        message: "Item deleted successfully!",
        deleted_item_id: itemId,
      });
    });
  });
});

// api for sellers
app.get("/orders/today", (req, res) => {
  const sql = `
    SELECT 
        q.queue_no,
        c.customer_name,
        c.customer_tel,
        o.order_id,
        o.order_time,
        o.order_status,
        oi.item_name,
        oi.item_detail,
        oi.item_quantity,
        oi.item_ware
    FROM orders o
    JOIN customers c ON o.customer_id = c.customer_id
    JOIN queues q ON o.order_id = q.order_id
    JOIN order_items oi ON o.order_id = oi.order_id
    WHERE DATE(o.order_time) = CURRENT_DATE
    ORDER BY q.queue_no ASC, oi.item_id ASC;
  `;

  db.query(sql, (err, result) => {
    if (err) {
      console.log("Error:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json(result);
  });
});
// change status for seller
app.put("/order/:id/status", (req, res) => {
  const orderId = req.params.id;
  const { status } = req.body;

  const sql = `
    UPDATE orders
    SET order_status = ?
    WHERE order_id = ?
  `;

  db.query(sql, [status, orderId], (err, result) => {
    if (err) {
      console.log("Status update error:", err);
      return res.status(500).json({ error: "Database error" });
    }

    res.json({ message: "Status updated successfully" });
  });
});

app.listen(3000, () => console.log("Server running on port 3000"));
