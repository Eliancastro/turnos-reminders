import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';

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

    // Respuesta inmediata
    res.json({ ok: true, message: "Turno reservado" });

    // Mail en segundo plano (SendGrid)
    sgMail.send({
      to: email,
      from: "turnos@sendgrid.net",
      subject: "Turno confirmado ✅",
      text: `Hola ${nombre},

Tu turno fue reservado correctamente.

📅 Fecha: ${fecha}
⏰ Hora: ${hora}
🛎 Servicio: ${servicio}

Gracias.`,
    })
    .then(() => console.log("📧 Mail enviado (SendGrid)"))
    .catch(err => console.error("❌ Error SendGrid:", err));

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
