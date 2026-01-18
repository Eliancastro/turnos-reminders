require('dotenv').config();
const { Resend } = require("resend");
const resend = new Resend(process.env.RESEND_API_KEY);
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
    const { nombre, telefono, email, fechaHora, servicio } = req.body;

    const [fecha, hora] = fechaHora.split("T");

    await turnos.insertOne({
      nombre,
      telefono,
      email,
      fecha,
      hora,
      servicio,
    });

    // Respuesta inmediata
    res.json({ ok: true, message: "Turno reservado" });

    // Mail en segundo plano
    resend.emails.send({
      from: "Turnos <onboarding@resend.dev>",
      to: email,
      subject: "Turno confirmado ✅",
      html: `
        <h2>Turno reservado</h2>
        <p><strong>Nombre:</strong> ${nombre}</p>
        <p><strong>Servicio:</strong> ${servicio}</p>
        <p><strong>Fecha:</strong> ${fecha}</p>
        <p><strong>Hora:</strong> ${hora}</p>
      `,
    })
    .then(() => console.log("📧 Mail enviado (Resend)"))
    .catch(err => console.error("❌ Error Resend:", err));

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
