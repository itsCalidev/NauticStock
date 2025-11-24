const Model = require("./Model");

class FaqCategory extends Model {
    constructor() {
        super();
        this.tableName = "faq_categories";
        this.fillable = ["name"];
        this.initializeDB();
    }

    async getAll() {
        try {
            return await this.getDB().select(["*"]).get();
        } catch (error) {
            console.error("Error in FaqCategory.getAll:", error);
            throw error;
        }
    }

    async create(data) {
        try {
            return await this.insert(data);
        } catch (error) {
            console.error("Error in FaqCategory.create:", error);
            throw error;
        }
    }

    async update(id, data) {
        try {
            return await this.getDB().where("id", id).update(this.tableName, data);
        } catch (error) {
            console.error("Error in FaqCategory.update:", error);
            throw error;
        }
    }

    async delete(id) {
        try {
            return await this.getDB().where("id", id).delete(this.tableName);
        } catch (error) {
            console.error("Error in FaqCategory.delete:", error);
            throw error;
        }
    }
}

module.exports = FaqCategory;
