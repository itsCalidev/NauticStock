const Model = require("./Model");

class Order extends Model {
    constructor() {
        super();
        this.tableName = "orders";
        this.initializeDB();
    }

    async getAll() {
        try {
            const query = `
        SELECT 
          o.id,
          o.product_id,
          o.provider_id,
          o.quantity,
          o.status,
          o.order_date,
          o.expected_date,
          o.notes,
          p.part_number as product_name,
          pr.name as provider_name,
          u.name as created_by_name
        FROM orders o
        LEFT JOIN products p ON o.product_id = p.id
        LEFT JOIN provider pr ON o.provider_id = pr.id
        LEFT JOIN user u ON o.created_by = u.id
        ORDER BY o.order_date DESC
      `;
            return await this.execute(query);
        } catch (error) {
            console.error('❌ Error in Order.getAll:', error);
            throw error;
        }
    }

    async create(data) {
        try {
            return await this.insert(data);
        } catch (error) {
            console.error('❌ Error in Order.create:', error);
            throw error;
        }
    }

    async updateOrder(id, data) {
        try {
            return await this.getDB()
                .where([["id", id]])
                .update(data);
        } catch (error) {
            console.error('❌ Error in Order.updateOrder:', error);
            throw error;
        }
    }

    async deleteOrder(id) {
        try {
            return await this.getDB()
                .where([["id", id]])
                .delete();
        } catch (error) {
            console.error('❌ Error in Order.deleteOrder:', error);
            throw error;
        }
    }
}

module.exports = Order;
