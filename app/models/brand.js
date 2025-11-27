const Model = require("./Model");

class Brand extends Model {
    constructor() {
        super();
        this.tableName = "brands";
        this.initializeDB();
    }

    async findByName(name) {
        try {
            const rows = await this.getDB()
                .select(["*"])
                .where([["name", name]])
                .get();
            return rows[0] || null;
        } catch (error) {
            console.error('❌ Error en Brand.findByName:', error);
            throw error;
        }
    }

    async create(name) {
        try {
            return await this.insert({ name, status: 0 });
        } catch (error) {
            console.error('❌ Error en Brand.create:', error);
            throw error;
        }
    }
    async getAll() {
        try {
            const query = `SELECT * FROM ${this.tableName}`;
            return await this.execute(query);
        } catch (error) {
            console.error('❌ Error en Brand.getAll:', error);
            throw error;
        }
    }

    async update(id, data) {
        try {
            return await this.getDB()
                .where([["id", id]])
                .update(data);
        } catch (error) {
            console.error('❌ Error en Brand.update:', error);
            throw error;
        }
    }

    async deleteBrand(id) {
        try {
            return await this.getDB()
                .where([["id", id]])
                .delete();
        } catch (error) {
            console.error('❌ Error en Brand.deleteBrand:', error);
            throw error;
        }
    }
}

module.exports = Brand;
