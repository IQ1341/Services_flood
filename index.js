const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const { db, messaging } = require("./firebase");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());

// ✅ Simpan data histori ketinggian ke Firestore
app.post("/api/histori", async (req, res) => {
  const { sungai, ketinggian, timestamp } = req.body;

  if (!sungai || ketinggian === undefined || !timestamp) {
    return res.status(400).json({ error: "Data tidak lengkap" });
  }

  try {
    await db.collection(sungai)
      .doc("riwayat")
      .collection("data")
      .add({
        value: ketinggian,
        timestamp: new Date(timestamp * 1000),
      });

    res.status(200).json({ message: "Data histori berhasil disimpan" });
  } catch (error) {
    console.error("❌ Error menyimpan histori:", error);
    res.status(500).json({ error: "Gagal menyimpan data histori" });
  }
});

// ✅ Simpan data notifikasi ke Firestore + kirim FCM
app.post("/api/notifikasi", async (req, res) => {
  const { sungai, ketinggian, timestamp, level } = req.body;

  if (!sungai || ketinggian === undefined || !timestamp || !level) {
    return res.status(400).json({ error: "Data notifikasi tidak lengkap" });
  }

  try {
    const dateStr = new Date(timestamp * 1000).toLocaleString("id-ID");
    const title = `Peringatan ${level}`;
    const message = `Ketinggian air di ${sungai} mencapai ${ketinggian} cm (${level}) pada ${dateStr}`;

    // Simpan notifikasi ke Firestore
    await db.collection(sungai)
      .doc("notifikasi")
      .collection("data")
      .add({
        title,
        message,
        timestamp: new Date(timestamp * 1000),
        level,
      });

    // Ambil token FCM dari Firestore
    const tokensSnapshot = await db.collection("tokens").get();
    const tokens = tokensSnapshot.docs.map(doc => doc.data().token);

    if (tokens.length > 0) {
      const payload = {
        notification: {
          title,
          body: message,
        },
        tokens: tokens, // Kirim ke banyak token
      };

      // Kirim notifikasi ke perangkat
      const response = await messaging.sendEachForMulticast(payload);
      console.log("📤 Notifikasi FCM dikirim:", response.successCount);

      // Hapus token yang gagal dikirim (unregistered, dll)
      const invalidTokens = response.responses
        .map((r, i) => (!r.success ? tokens[i] : null))
        .filter(t => t !== null);

      for (const token of invalidTokens) {
        const snapshot = await db.collection("tokens").where("token", "==", token).get();
        snapshot.forEach(doc => doc.ref.delete());
        console.log("🧹 Token invalid dihapus:", token);
      }
    } else {
      console.log("⚠️ Tidak ada token pengguna ditemukan.");
    }

    res.status(200).json({ message: "Notifikasi berhasil disimpan dan dikirim" });
  } catch (error) {
    console.error("❌ Error notifikasi:", error);
    res.status(500).json({ error: "Gagal menyimpan/kirim notifikasi" });
  }
});

// ✅ Simpan token FCM dari aplikasi Flutter
app.post("/api/save-token", async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ error: "Token tidak ditemukan" });
  }

  try {
    const snapshot = await db.collection("tokens").where("token", "==", token).get();
    if (snapshot.empty) {
      await db.collection("tokens").add({ token });
      console.log("✅ Token disimpan:", token);
    } else {
      console.log("ℹ️ Token sudah ada:", token);
    }

    res.status(200).json({ message: "Token berhasil disimpan" });
  } catch (error) {
    console.error("❌ Gagal simpan token:", error);
    res.status(500).json({ error: "Gagal simpan token" });
  }
});

// Jalankan server
app.listen(PORT, () => {
  console.log(`🚀 Server berjalan di http://localhost:${PORT}`);
});
