const { db, messaging } = require('../firebase');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { sungai, ketinggian, timestamp, level } = req.body;

  if (!sungai || ketinggian === undefined || !timestamp || !level) {
    return res.status(400).json({ error: "Data notifikasi tidak lengkap" });
  }

  try {
    const dateStr = new Date(timestamp * 1000).toLocaleString("id-ID");
    const title = `Peringatan ${level}`;
    const message = `Ketinggian air di ${sungai} mencapai ${ketinggian} cm (${level}) pada ${dateStr}`;

    // Simpan ke Firestore
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
        tokens,
      };

      // Kirim notifikasi ke banyak token
      const response = await messaging.sendEachForMulticast(payload);
      console.log("📤 FCM success:", response.successCount);

      // Hapus token yang gagal
      const invalidTokens = response.responses
        .map((r, i) => (!r.success ? tokens[i] : null))
        .filter(Boolean);

      for (const token of invalidTokens) {
        const snapshot = await db.collection("tokens").where("token", "==", token).get();
        snapshot.forEach(doc => doc.ref.delete());
        console.log("🧹 Token invalid dihapus:", token);
      }
    } else {
      console.log("⚠️ Tidak ada token ditemukan.");
    }

    res.status(200).json({ message: "Notifikasi berhasil disimpan dan dikirim" });
  } catch (error) {
    console.error("❌ Error notifikasi:", error);
    res.status(500).json({ error: "Gagal menyimpan/kirim notifikasi" });
  }
};
