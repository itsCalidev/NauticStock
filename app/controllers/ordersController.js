const Order = require('../models/order');
const History = require('../models/history');

const orderModel = new Order();
const historyModel = new History();

exports.getAllOrders = async (req, res) => {
    try {
        const orders = await orderModel.getAll();
        res.json({ success: true, data: orders });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.createOrder = async (req, res) => {
    try {
        const { product_id, provider_id, quantity, notes, expected_date } = req.body;
        const userId = req.user.id;

        if (!product_id || !provider_id || !quantity) {
            return res.status(400).json({ success: false, error: 'Faltan campos requeridos' });
        }

        const orderId = await orderModel.create({
            product_id,
            provider_id,
            quantity,
            notes,
            expected_date,
            created_by: userId,
            status: 'pending'
        });

        // Registrar historial
        await historyModel.registerLog({
            action_type: 'Crear Orden',
            performed_by: userId,
            entity_type: 'orders',
            entity_id: orderId,
            description: `Orden creada para producto ID ${product_id}`
        });

        res.json({ success: true, message: 'Orden creada exitosamente', id: orderId });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

const socketManager = require("../classes/socketManager");

exports.updateOrder = async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;
        const userId = req.user.id;

        // Check if status is changing to 'received'
        if (data.status === 'received') {
            // Get current order details
            const order = await orderModel.findById(id);
            if (!order) {
                return res.status(404).json({ success: false, error: 'Orden no encontrada' });
            }

            if (order.status === 'received') {
                return res.status(400).json({ success: false, error: 'La orden ya ha sido recibida' });
            }

            // Get product details
            const Products = require('../models/products');
            const productModel = new Products();
            const product = await productModel.findById(order.product_id);

            if (product) {
                // Update product stock
                const newQuantity = (product.quantity || 0) + order.quantity;
                await productModel.updateProduct(order.product_id, { quantity: newQuantity });

                // Emit socket event for product update
                const updatedProductPayload = { ...product, quantity: newQuantity };
                socketManager.emit("product_updated", updatedProductPayload);

                // Log stock update
                await historyModel.registerLog({
                    action_type: 'Actualizar Stock',
                    performed_by: userId,
                    entity_type: 'products',
                    entity_id: order.product_id,
                    old_value: product.quantity,
                    new_value: newQuantity,
                    description: `Stock actualizado por recepción de orden #${id}`
                });
            }
        }

        await orderModel.updateOrder(id, data);

        // Emit socket event for order update (if there's a listener for it, otherwise it's good practice)
        socketManager.emit("order_updated", { id, ...data });

        // Registrar historial
        await historyModel.registerLog({
            action_type: 'Actualizar Orden',
            performed_by: userId,
            entity_type: 'orders',
            entity_id: id,
            description: `Orden actualizada (ID: ${id})`
        });

        res.json({ success: true, message: 'Orden actualizada exitosamente' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.deleteOrder = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        await orderModel.deleteOrder(id);

        // Registrar historial
        await historyModel.registerLog({
            action_type: 'Eliminar Orden',
            performed_by: userId,
            entity_type: 'orders',
            entity_id: id,
            description: `Orden eliminada (ID: ${id})`
        });

        res.json({ success: true, message: 'Orden eliminada exitosamente' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
