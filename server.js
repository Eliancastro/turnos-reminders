require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const { MongoClient, ObjectId } = require('mongodb');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = 'turnos_db';

let turnos;

async function initDb() {
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db(DB_NAME);
  turnos = db.collection('turnos');
  console.log('✅ MongoDB conectado');
}

app.post('/api/turnos', async (req, res) => {
  const { nombre, telefono, email, fechaHora, servicio } = req.body;
  const turno = {
    nombre,
    telefono,
    email,
    servicio,
    fechaHora: new Date(fechaHora),
    estado: 'pendiente',
    createdAt: new Date()
  };
  await turnos.insertOne(turno);
  res.json({ ok: true });
});

app.get('/api/turnos', async (req, res) => {
  const items = await turnos.find().sort({ fechaHora: 1 }).toArray();
  res.json(items);
});

const PORT = 3000;

initDb().then(() => {
  app.listen(PORT, () =>
    console.log(`🚀 Servidor en http://localhost:${PORT}`)
  );
});
