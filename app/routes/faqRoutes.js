const express = require('express');
const router = express.Router();
const faqController = require('../controllers/FaqController');

router.get('/', faqController.getAllFaqs);
router.post('/', faqController.createFaq);
router.put('/:id', faqController.updateFaq);
router.delete('/:id', faqController.deleteFaq);
router.put('/:id/status', faqController.toggleStatus);

// Categories routes
router.get('/categories', faqController.getCategories);
router.post('/categories', faqController.createCategory);

module.exports = router;
