// server.js
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const { db } = require("./firebase"); // pastikan file firebase.js terkonfigurasi

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());

// Endpoint untuk menyimpan data histori ketinggian ke Firestore
app.post("/api/histori", async (req, res) => {
  const { sungai, ketinggian, timestamp } = req.body;

  if (!sungai || ketinggian === undefined || !timestamp) {
    return res.status(400).json({ error: "Data tidak lengkap" });
  }

  try {
    // Simpan data ke Firestore di koleksi: /{sungai}/riwayat/data
    await db.collection(sungai)
      .doc("riwayat")
      .collection("data")
      .add({
        value: ketinggian,
        timestamp: new Date(timestamp * 1000), // Konversi epoch detik ke objek Date
      });

    res.status(200).json({ message: "Data berhasil disimpan ke Firestore" });
  } catch (error) {
    console.error("❌ Error menyimpan ke Firestore:", error);
    res.status(500).json({ error: "Gagal menyimpan data" });
  }
});

// Jalankan server
app.listen(PORT, () => {
  console.log(`🚀 Server berjalan di http://localhost:${PORT}`);
});
