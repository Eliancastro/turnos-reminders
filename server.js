import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import path from "path";
import { fileURLToPath } from "url";
import { MongoClient } from "mongodb";
import sgMail from "@sendgrid/mail";

// ===============================
// CONFIG BÁSICA
// ===============================
const app = express();

app.use(cors());
app.use(bodyParser.json());

// __dirname en ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, "public")));

// ===============================
// VARIABLES DE ENTORNO
// ===============================
const MONGODB_URI = process.env.MONGODB_URI;
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const DB_NAME = "turnos_db";
const PORT = process.env.PORT || 3000;

// ===============================
// SENDGRID
// ===============================
sgMail.setApiKey(SENDGRID_API_KEY);

// ===============================
// MONGODB
// ===============================
let turnos;

async function initDb() {
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db(DB_NAME);
  turnos = db.collection("turnos");
  console.log("✅ MongoDB conectado");
}

// ===============================
// ENDPOINT CREAR TURNO
// ===============================
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
      createdAt: new Date(),
    });

    // RESPUESTA INMEDIATA
    res.json({ ok: true, message: "Turno reservado" });

    // MAIL EN SEGUNDO PLANO
    const msg = {
      to: email,
      from: "Turnos <no-reply@resend.dev>", // funciona sin dominio propio
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
      .catch(err =>
        console.error("❌ Error SendGrid:", err.response?.body || err)
      );

  } catch (error) {
    console.error("❌ Error creando turno:", error);
    if (!res.headersSent) {
      res.status(500).json({ ok: false, message: "Error al reservar turno" });
    }
  }
});

// ===============================
// ENDPOINT LISTAR TURNOS
// ===============================
app.get("/api/turnos", async (req, res) => {
  const items = await turnos.find().sort({ createdAt: -1 }).toArray();
  res.json(items);
});

// ===============================
// START SERVER
// ===============================
initDb().then(() => {
  app.listen(PORT, () =>
    console.log(`🚀 Servidor en puerto ${PORT}`)
  );
});
