import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  email: {type: String, unique: true, required: false}, // UNIQUE, required untuk login
  password: {type: String, required: true}, // Hashed dengan bcrypt/argon2
  phone: {type: String, unique: true}, // Format: +628123456789, UNIQUE
  name: {type: String, required: true}, // Nama lengkap user
  role: {type: String, enum: ['customer', 'admin', 'dropper', 'courier', 'technician', 'qc']}, // ENUM: 'customer' | 'admin' | 'dropper' | 'courier' | 'technician' | 'qc'

  // ====== KHUSUS CUSTOMER ======
  isGuest: {type: Boolean, default: false}, // true jika order tanpa register, default: false
  loyaltyPoints: {type: Number, default: 0}, // Poin loyalitas, default: 0
  totalOrders: {type: Number, default: 0}, // Jumlah order yang completed, default: 0
  memberSince: {type: Date, default: Date.now}, // Tanggal menjadi member

  // ====== KHUSUS DROPPER ======
  dropPointInfo: {
    name: {type: String, required: true}, // Nama drop point, misal: "Alfamart Sudirman"
    address: {type: String, required: true}, // Alamat lengkap
    coordinates: {
      lat: {type: Number, required: true}, // -6.xxx (Jakarta area)
      lng: {type: Number, required: true}, // 106.xxx
    },
    openingHours: {type: String, required: true}, // "08:00-20:00" atau JSON {mon: "08:00-20:00", ...}
    capacity: {type: Number, required: true}, // Max barang yang bisa disimpan
    currentLoad: {type: Number, default: 0}, // Jumlah barang saat ini
  },

  // ====== KHUSUS COURIER ======
  courierInfo: {
    vehicleType: {type: String, enum: ['motorcycle', 'car']}, // ENUM: 'motorcycle' | 'car'
    vehicleNumber: {type: String, required: true}, // Plat nomor, misal: "B 1234 XYZ"
    isAvailable: {type: Boolean, default: true}, // Status ketersediaan, default: true
    currentLocation: {
      lat: {type: Number, required: true}, // Lokasi terakhir kurir
      lng: {type: Number, required: true},
    },
    lastLocationUpdate: {type: Date, default: Date.now}, // Timestamp update lokasi
  },

  // ====== METADATA ======
  createdAt: {type: Date, default: Date.now}, // Auto-generated saat register
  updatedAt: {type: Date, default: Date.now}, // Auto-update saat ada perubahan
  lastLogin: {type: Date, default: null}, // Timestamp login terakhir
  isActive: {type: Boolean, default: true}, // Status aktif/non-aktif, default: true
  profilePhoto: {type: String, default: null}, // URL foto profil, default: null
});

export const Users = mongoose.models.users || mongoose.model("users", userSchema, "users");