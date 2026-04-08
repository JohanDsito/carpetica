const express = require('express');
const app = express();
const path = require('path');

// Sirve el index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Nginx enviará el tráfico aquí
app.listen(3000, () => {
  console.log('Servidor interno corriendo en el puerto 3000');
});