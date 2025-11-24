const Model = require("./Model");

class Faq extends Model {
    constructor() {
        super();
        this.tableName = "faqs";
        this.fillable = ["question", "answer", "status", "category_id"];
        this.initializeDB();
    }

    async getAll() {
        try {
            const db = this.getDB();
            // Join with faq_categories to get category name
            const rows = await db
                .select([
                    "faqs.id",
                    "faqs.question",
                    "faqs.answer",
                    "faqs.status",
                    "faqs.category_id",
                    "faqs.created_at",
                    "faqs.last_updated",
                    "faq_categories.name as category_name"
                ])
                .join("faq_categories", "faq_categories.id = faqs.category_id", "LEFT")
                .get();
            return rows;
        } catch (error) {
            console.error("Error in Faq.getAll:", error);
            throw error;
        }
    }

    async create(data) {
        try {
            // Default status to 0 (Active) if not provided, consistent with other models
            if (data.status === undefined) {
                data.status = 0;
            }
            return await this.insert(data);
        } catch (error) {
            console.error("Error in Faq.create:", error);
            throw error;
        }
    }

    async update(id, data) {
        try {
            return await this.getDB().where([["id", id]]).update(data);
        } catch (error) {
            console.error("Error in Faq.update:", error);
            throw error;
        }
    }

    async delete(id) {
        try {
            return await this.getDB().where([["id", id]]).delete();
        } catch (error) {
            console.error("Error in Faq.delete:", error);
            throw error;
        }
    }
}

module.exports = Faq;
