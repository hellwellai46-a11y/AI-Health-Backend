import express from 'express';
import { calculateNutrition, getAvailableFoods } from '../controllers/nutritionController.js';

const router = express.Router();

// Calculate nutrition from food input
router.post('/calculate', calculateNutrition);

// Get list of available foods
router.get('/foods', getAvailableFoods);

export default router;

