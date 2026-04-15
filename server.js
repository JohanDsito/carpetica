cat > /home/azureuser/carpetica/server.js << 'EOF'
const express = require('express');
const jwt = require('jsonwebtoken');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const path = require('path');

const app = express();
app.use(express.json());

const JWT_SECRET = 'mi_secreto_super_seguro_2024';
const USER = {
  username: 'admin',
  password: '1234',
  secret: speakeasy.generateSecret({ name: 'MarketplaceTech' })
};

app.get('/setup-2fa', async (req, res) => {
  const qr = await QRCode.toDataURL(USER.secret.otpauth_url);
  res.send('<img src="' + qr + '" /><p>Escanea con Google Authenticator</p>');
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (username !== USER.username || password !== USER.password) {
    return res.status(401).json({ error: 'Credenciales incorrectas' });
  }
  const tempToken = jwt.sign({ username, step: '2fa' }, JWT_SECRET, { expiresIn: '5m' });
  res.json({ tempToken });
});

app.post('/verify-2fa', (req, res) => {
  const { tempToken, code } = req.body;
  try {
    const decoded = jwt.verify(tempToken, JWT_SECRET);
    if (decoded.step !== '2fa') return res.status(401).json({ error: 'Token invalido' });
    const valid = speakeasy.totp.verify({
      secret: USER.secret.base32,
      encoding: 'base32',
      token: code,
      window: 2
    });
    if (!valid) return res.status(401).json({ error: 'Codigo 2FA incorrecto' });
    const token = jwt.sign({ username: decoded.username }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
  } catch (e) {
    res.status(401).json({ error: 'Token expirado o invalido' });
  }
});

// ✅ Todo va a un solo archivo
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

app.listen(3000, () => console.log('Servidor corriendo en puerto 3000'));
EOF