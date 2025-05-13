const { db } = require('../firebase');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: "Method not allowed" });
  }

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
};
