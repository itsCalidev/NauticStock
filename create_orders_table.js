const DB = require('./app/classes/db');

async function createTable() {
    const db = new DB('orders');
    const sql = `
    CREATE TABLE IF NOT EXISTS orders (
      id INT AUTO_INCREMENT PRIMARY KEY,
      product_id INT NOT NULL,
      provider_id INT NOT NULL,
      quantity INT NOT NULL,
      status ENUM('pending', 'received', 'cancelled') DEFAULT 'pending',
      order_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      expected_date DATE NULL,
      notes TEXT NULL,
      created_by INT NULL,
      FOREIGN KEY (product_id) REFERENCES products(id),
      FOREIGN KEY (provider_id) REFERENCES provider(id),
      FOREIGN KEY (created_by) REFERENCES user(id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;

    try {
        await db.execute(sql);
        console.log('✅ Table "orders" created successfully.');
    } catch (error) {
        console.error('❌ Error creating table:', error);
    } finally {
        process.exit();
    }
}

createTable();
