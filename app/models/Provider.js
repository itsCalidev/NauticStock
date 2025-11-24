const Model = require("./Model");

class Provider extends Model {
    constructor() {
        super();
        this.tableName = "provider";
        this.initializeDB();
    }

    async getAll(showInactive = false) {
        try {
            let query = this.getDB().select(["*"]);

            if (!showInactive) {
                query = query.where([["status", 0]]);
            }

            const rows = await query.orderBy([["created_at", "DESC"]]).get();
            return rows;
        } catch (error) {
            console.error('❌ Error en Provider.getAll:', error);
            throw error;
        }
    }

    async findByName(name) {
        try {
            const rows = await this.getDB()
                .select(["*"])
                .where([["name", name]])
                .get();
            return rows[0] || null;
        } catch (error) {
            console.error('❌ Error en Provider.findByName:', error);
            throw error;
        }
    }

    async create(data) {
        try {
            // data debe contener: name, company, email, address, registration, phone, website, contact_name
            return await this.insert(data);
        } catch (error) {
            console.error('❌ Error en Provider.create:', error);
            throw error;
        }
    }

    async update(id, data) {
        try {
            return await this.getDB()
                .where([["id", id]])
                .update(data);
        } catch (error) {
            console.error('❌ Error en Provider.update:', error);
            throw error;
        }
    }

    async deleteProvider(id) {
        try {
            // Soft delete: set status to 1
            return await this.getDB()
                .where([["id", id]])
                .update({ status: 1 });
        } catch (error) {
            console.error('❌ Error en Provider.deleteProvider:', error);
            throw error;
        }
    }

    async toggleStatus(id, currentStatus) {
        try {
            const newStatus = currentStatus === 0 ? 1 : 0;
            return await this.getDB()
                .where([["id", id]])
                .update({ status: newStatus });
        } catch (error) {
            console.error('❌ Error en Provider.toggleStatus:', error);
            throw error;
        }
    }
}

module.exports = Provider;
