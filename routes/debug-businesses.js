const express = require('express');
const router = express.Router();
const Business = require('../models/Business');

// GET /debug/businesses - Ver todos los negocios en MongoDB
router.get('/businesses', async (req, res) => {
  try {
    const businesses = await Business.find({});
    
    res.json({
      success: true,
      count: businesses.length,
      businesses: businesses.map(biz => ({
        id: biz._id,
        businessName: biz.businessName,
        whatsappBusiness: biz.whatsappBusiness,
        plan: biz.plan,
        businessType: biz.businessType,
        onboardingCompleted: biz.onboardingCompleted,
        createdAt: biz.createdAt
      }))
    });
  } catch (error) {
    console.error('Error obteniendo negocios:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
