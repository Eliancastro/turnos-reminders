import express from 'express';
import sgMail from "@sendgrid/mail";
import 'dotenv/config';
dotenv.config();

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

import bodyParser from 'body-parser';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { MongoClient } from 'mongodb';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

    // RESPONDEMOS UNA SOLA VEZ
    res.json({ ok: true, message: "Turno reservado" });

    // MAIL EN SEGUNDO PLANO
    const msg = {
      to: email,
      from: "Turnos <no-reply@tudominio.com>", // puede ser cualquier mail válido
      subject: "Turno confirmado ✅",
      html: `
        <h2>Turno reservado</h2>
        <p><strong>Nombre:</strong> ${nombre}</p>
        <p><strong>Servicio:</strong> ${servicio}</p>
        <p><strong>Fecha:</strong> ${fecha}</p>
        <p><strong>Hora:</strong> ${hora}</p>
      `,
    };

    sgMail
      .send(msg)
      .then(() => console.log("📧 Mail enviado (SendGrid)"))
      .catch(err => console.error("❌ Error SendGrid:", err));

  } catch (error) {
    console.error("❌ Error creando turno:", error);
    if (!res.headersSent) {
      res.status(500).json({ ok: false, message: "Error al reservar turno" });
    }
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
