const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.send('<h1>Onboarding Dashboard</h1><p>Sistema para crear clientes</p>');
});

module.exports = router;
