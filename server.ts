import express from "express";
import http from "http";
import path from "path";
import fs from "fs";
import { Server } from "socket.io";
import multer from "multer";

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });
const PORT = 3000;

app.use(express.json());

// Ensure directories exist
const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
const dataFile = path.join(process.cwd(), "data.json");

// Default Settings
const defaultSettings = {
  mosqueName: "MASJID BAITURRAHMAN",
  mosqueAddress: "Jl. Jenderal Sudirman No. 1, Jakarta",
  location: {
    lat: -6.2000,
    lng: 106.8166,
    city: "Jakarta",
  },
  display: {
    mode: "mixed", // 'schedule', 'slide', 'video', 'mixed'
    slideDuration: 10, // seconds
    mixedPattern: [{ type: 'schedule', duration: 10 }, { type: 'slide', duration: 5 }],
    runningText: "Selamat datang di Masjid Baiturrahman. Luruskan dan rapatkan shaf. | Ilmu kajian hatim selesai hari kamis ba'da dzuhur.",
    runningTextSpeed: "medium",
    leftBgImage: "https://images.unsplash.com/photo-1564683214964-b31c0ee611fc?q=80&w=2070&auto=format&fit=crop",
    mediaFullScreen: false,
    bgColor: "#f3f4f6", // soft gray
    boxColor: "#ffffff",
  },
  audio: {
    adzanActive: true,
    adzanType: "default",
    adzanVolume: 80,
    iqomahActive: true,
    iqomahType: "default",
    iqomahDuration: 10, // minutes
    iqomahVolume: 80,
    warningAudioActive: false,
    warningMinutes: 10,
  },
  slides: [],
  videos: [],
};

// Initialize settings file
if (!fs.existsSync(dataFile)) {
  fs.writeFileSync(dataFile, JSON.stringify(defaultSettings, null, 2));
}

let parsedSettings = JSON.parse(fs.readFileSync(dataFile, "utf-8"));
let currentSettings = {
  ...defaultSettings,
  ...parsedSettings,
  display: {
    ...defaultSettings.display,
    ...(parsedSettings.display || {})
  },
  audio: {
    ...defaultSettings.audio,
    ...(parsedSettings.audio || {})
  }
};

// Serve uploaded files
app.use("/uploads", express.static(uploadsDir));

// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, filename);
  },
});
const upload = multer({ storage });

// API Routes
app.get("/api/settings", (req, res) => {
  res.json(currentSettings);
});

app.post("/api/settings", (req, res) => {
  currentSettings = { ...currentSettings, ...req.body };
  fs.writeFileSync(dataFile, JSON.stringify(currentSettings, null, 2));
  io.emit("settingsUpdated", currentSettings);
  res.json({ success: true, settings: currentSettings });
});

app.post("/api/upload", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }
  const fileUrl = `/uploads/${req.file.filename}`;
  res.json({ success: true, url: fileUrl, filename: req.file.filename });
});

app.delete("/api/upload/:filename", (req, res) => {
  const file = path.join(uploadsDir, req.params.filename);
  if (fs.existsSync(file)) {
    fs.unlinkSync(file);
    res.json({ success: true });
  } else {
    res.status(404).json({ error: "File not found" });
  }
});

// Socket.io
io.on("connection", (socket) => {
  console.log("Client connected", socket.id);
  socket.emit("settingsUpdated", currentSettings);
  
  socket.on("force-prayer-event", (eventData) => {
    io.emit("prayer-event", eventData); // sync prayer events between displays if needed
  });
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
