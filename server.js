require('dotenv').config();
const nodemailer = require("nodemailer");
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});
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

app.post("/api/turnos", async (req, res) => {
  try {
    const turno = {
      fecha: req.body.fecha,
      hora: req.body.hora,
      email: req.body.email,
    };

    await turnos.insertOne(turno);

    // Respondemos inmediatamente
    res.json({ ok: true, message: "Turno reservado" });
    console.log("📩 Email recibido:", req.body.email);


    // Envío de mail en segundo plano
    transporter.sendMail({
      from: `"Turnos" <${process.env.SMTP_USER}>`,
      to: req.body.email,
      subject: "Turno confirmado ✅",
      html: `
        <h2>Turno reservado</h2>
        <p>Fecha: ${req.body.fecha}</p>
        <p>Hora: ${req.body.hora}</p>
      `,
    })
    .then(() => console.log("📧 Mail enviado"))
    .catch(err => console.error("❌ Error mail:", err.message));

  } catch (error) {
    console.error("❌ Error creando turno:", error);
    res.status(500).json({ ok: false, message: "Error al reservar turno" });
  }
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
