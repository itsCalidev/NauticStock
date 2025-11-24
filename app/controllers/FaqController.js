const Faq = require("../models/Faq");
const FaqCategory = require("../models/FaqCategory");

const faqModel = new Faq();
const faqCategoryModel = new FaqCategory();

exports.getAllFaqs = async (req, res) => {
    try {
        const faqs = await faqModel.getAll();
        res.json({ success: true, data: faqs });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.createFaq = async (req, res) => {
    try {
        const { question, answer, category_id } = req.body;
        if (!question || !answer) {
            return res.status(400).json({ success: false, error: "Pregunta y respuesta son requeridas" });
        }

        const result = await faqModel.create({ question, answer, category_id, status: 0 });
        res.json({ success: true, message: "FAQ creada exitosamente", id: result.insertId });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.updateFaq = async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;
        await faqModel.update(id, data);
        res.json({ success: true, message: "FAQ actualizada exitosamente" });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.deleteFaq = async (req, res) => {
    try {
        const { id } = req.params;
        await faqModel.delete(id);
        res.json({ success: true, message: "FAQ eliminada exitosamente" });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.toggleStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        await faqModel.update(id, { status });
        res.json({ success: true, message: "Estado actualizado" });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.getCategories = async (req, res) => {
    try {
        const categories = await faqCategoryModel.getAll();
        res.json({ success: true, data: categories });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.createCategory = async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) return res.status(400).json({ success: false, error: "Nombre requerido" });
        const result = await faqCategoryModel.insert({ name });
        res.json({ success: true, id: result.insertId });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}
