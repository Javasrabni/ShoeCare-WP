import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  email: { type: String, unique: true}, // UNIQUE, required untuk login
  password: { type: String, required: true }, // Hashed dengan bcrypt/argon2
  phone: { type: String, unique: true, required: true }, // Format: +628123456789, UNIQUE
  name: { type: String, required: true }, // Nama lengkap user
  role: {
    type: String,
    enum: ["customer", "admin", "dropper", "courier", "technician", "qc"],
    required: true,
  }, // ENUM: 'customer' | 'admin' | 'dropper' | 'courier' | 'technician' | 'qc'

  // ====== KHUSUS CUSTOMER ======
  isGuest: { type: Boolean, default: true }, // true jika order tanpa register, default: false
  loyaltyPoints: { type: Number, default: 0 }, // Poin loyalitas, default: 0
  totalOrders: { type: Number, default: 0 }, // Jumlah order yang completed, default: 0
  memberSince: { type: Date, default: Date.now }, // Tanggal menjadi member
  subscriptionDuration: { type: Number, default: 0 }, // Durasi langganan dalam bulan, default: 0
  subscriptionExpiry: { type: Date, default: null }, // Tanggal kedaluwarsa langganan, default: null
  subscriptionType: { type: String, enum: ["free","basic", "premium", "vip"], default: "free" }, // ENUM: 'basic' | 'premium' | 'vip' | "free", default: 'free'

  // ====== KHUSUS DROPPER ======
  dropPointInfo: {
    name: { type: String, default: "-" }, // Nama drop point, misal: "Alfamart Sudirman"
    address: { type: String, default: "-" }, // Alamat lengkap
    coordinates: {
      lat: { type: Number, default: 0 }, // -6.xxx (Jakarta area)
      lng: { type: Number, default: 0 }, // 106.xxx
    },
    openingHours: { type: String, default: "-" }, // "08:00-20:00" atau JSON {mon: "08:00-20:00", ...}
    capacity: { type: Number, default: 0 }, // Max barang yang bisa disimpan
    currentLoad: { type: Number, default: 0 }, // Jumlah barang saat ini
  },

  // ====== KHUSUS COURIER ======
  courierInfo: {
    vehicleType: { type: String, enum: ["motorcycle", "car"], default: "motorcycle" }, // ENUM: 'motorcycle' | 'car'
    vehicleNumber: { type: String, default: "-" }, // Plat nomor, misal: "B 1234 XYZ"
    isAvailable: { type: Boolean, default: true }, // Status ketersediaan, default: true
    currentLocation: {
      lat: { type: Number, default: 0 }, // Lokasi terakhir kurir
      lng: { type: Number, default: 0 },
    },
    lastLocationUpdate: { type: Date, default: Date.now }, // Timestamp update lokasi
  },

  // ====== METADATA ======
  lastLogin: { type: Date, default: null }, // Timestamp login terakhir
  isActive: { type: Boolean, default: true }, // Status aktif/non-aktif, default: true
  profilePhoto: { type: String, default: null }, // URL foto profil, default: null
}, { timestamps: true }); // Menambahkan createdAt dan updatedAt otomatis

export const Users =
  mongoose.models.users || mongoose.model("users", userSchema, "users");
