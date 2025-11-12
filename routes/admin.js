const express = require('express');
const router = express.Router();
const Appointment = require('../models/Appointment');
const Business = require('../models/Business');
const { sendWhatsApp } = require('../config/twilio');

router.get('/appointments/today/:businessId', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const appointments = await Appointment.find({
      businessId: req.params.businessId,
      datetime: { $gte: today, $lt: tomorrow }
    }).sort({ datetime: 1 });

    res.json(appointments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/appointments/:id/start', async (req, res) => {
  try {
    const apt = await Appointment.findByIdAndUpdate(
      req.params.id,
      { status: 'en-curso' },
      { new: true }
    );
    res.json(apt);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/appointments/:id/complete', async (req, res) => {
  try {
    const apt = await Appointment.findByIdAndUpdate(
      req.params.id,
      { status: 'completada' },
      { new: true }
    );
    res.json(apt);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/appointments/:id/delay', async (req, res) => {
  try {
    const { minutes } = req.body;
    const apt = await Appointment.findById(req.params.id);
    
    apt.status = 'retrasada';
    apt.delay += minutes;
    await apt.save();

    const business = await Business.findById(apt.businessId);
    const followingApts = await Appointment.find({
      businessId: apt.businessId,
      datetime: { $gt: apt.datetime },
      status: { $in: ['confirmada', 'retrasada'] }
    });

    for (const followApt of followingApts) {
      const message = `⚠️ *Retraso en tu cita*\n\n` +
        `Hola ${followApt.patient.name},\n\n` +
        `Tu cita se retrasará aproximadamente ${minutes} minutos.\n\n` +
        `Gracias por tu comprensión 🙏`;
      
      await sendWhatsApp(business, followApt.patient.phone, message);
    }

    res.json({ success: true, notified: followingApts.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
