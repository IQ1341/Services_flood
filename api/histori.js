// api/histori.js
const { db } = require('../firebase');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: "Method not allowed" });
  }

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

    return res.status(200).json({ message: "Data histori berhasil disimpan" });
  } catch (error) {
    console.error("❌ Error menyimpan histori:", error);
    return res.status(500).json({ error: "Gagal menyimpan data histori" });
  }
};
