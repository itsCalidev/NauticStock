const Model = require("./Model");

class Rank extends Model {
    constructor() {
        super();
        this.tableName = "ranks";
        this.initializeDB();
    }

    async getAllRanks() {
        try {
            const query = `SELECT * FROM ${this.tableName}`;
            return await this.execute(query);
        } catch (error) {
            console.error("Error en getAllRanks:", error);
            throw error;
        }
    }

    async getRankByName(name) {
        try {
            const result = await this.select()
                .where([["name", name]])
                .get();
            return result[0];
        } catch (error) {
            console.error("Error en getRankByName:", error);
            throw error;
        }
    }

    async createRank(data) {
        try {
            return await this.insert(data);
        } catch (error) {
            console.error("Error en createRank:", error);
            throw error;
        }
    }

    async updateRank(id, data) {
        try {
            return await this.getDB()
                .where([["id", id]])
                .update(data);
        } catch (error) {
            console.error("Error en updateRank:", error);
            throw error;
        }
    }

    async deleteRank(id) {
        try {
            return await this.getDB()
                .where([["id", id]])
                .delete();
        } catch (error) {
            console.error("Error en deleteRank:", error);
            throw error;
        }
    }
}

module.exports = Rank;
