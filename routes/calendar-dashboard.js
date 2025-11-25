const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  const { businessId, clientName, service, phone } = req.query;
  res.send('<h1>Calendario Funcional</h1><p>Sistema de citas operativo</p>');
});

module.exports = router;
