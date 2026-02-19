// models/Order.ts
import mongoose from "mongoose";

const OrderItemSchema = new mongoose.Schema({
  itemType: { type: String, required: true }, // "Sepatu", "Tas", dll
  treatmentType: { type: String, required: true }, // "Deep Clean", "Repaint", dll
  quantity: { type: Number, default: 1 },
  price: { type: Number, required: true }, // Harga per item
  notes: { type: String, default: "" },
});

const OrderSchema = new mongoose.Schema(
  {
    // ====== IDENTIFIKASI ORDER ======
    orderNumber: { type: String, unique: true, required: true }, // SC-20250219-XXXX

    // ====== INFORMASI CUSTOMER ======
    customerInfo: {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
        default: null,
      }, // null jika guest
      name: { type: String, required: true },
      phone: { type: String, required: true }, // Format: +628123456789
      isGuest: { type: Boolean, default: true },
    },

    // ====== LAYANAN ======
    serviceType: {
      type: String,
      enum: ["antar-jemput", "drop-point"],
      required: true,
    },

    // ====== LOKASI (Khusus Antar-Jemput) ======
    pickupLocation: {
      address: { type: String, default: "" }, // Alamat lengkap input manual
      coordinates: {
        lat: { type: Number, required: true },
        lng: { type: Number, required: true },
      },
      dropPointId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "DropPoint",
        default: null,
      },
      dropPointName: { type: String, default: "" },
      distanceKM: { type: Number, default: 0 },
      deliveryFee: { type: Number, default: 0 }, // Ongkir
    },

    // ====== ITEMS ======
    items: [OrderItemSchema],

    // ====== PEMBAYARAN ======
    payment: {
      method: { type: String, enum: ["qris", "transfer"], required: true },
      status: {
        type: String,
        enum: ["pending", "waiting_confirmation", "paid", "failed", "refunded"],
        default: "pending",
      },
      amount: { type: Number, required: true }, // Total yang harus dibayar
      subtotal: { type: Number, required: true }, // Total item (tanpa ongkir)
      deliveryFee: { type: Number, default: 0 },
      discountPoints: { type: Number, default: 0 }, // Potongan dari poin loyalitas
      finalAmount: { type: Number, required: true }, // Total setelah diskon

      // Bukti pembayaran (untuk transfer)
      proofImage: { type: String, default: null },
      paidAt: { type: Date, default: null },

      // QRIS data
      qrisData: {
        qrString: { type: String, default: null },
        expiredAt: { type: Date, default: null },
      },
    },

    // ====== STATUS ORDER ======
    status: {
      type: String,
      enum: [
        "pending", // Menunggu konfirmasi admin
        "confirmed", // Dikonfirmasi admin, cari kurir
        "courier_assigned", // Kurir ditugaskan
        "pickup_in_progress", // Kurir menuju lokasi
        "picked_up", // Barang sudah diambil
        "in_workshop", // Di workshop
        "processing", // Sedang dikerjakan technician
        "qc_check", // Quality Control
        "ready_for_delivery", // Siap diantar/diambil
        "delivery_in_progress", // Dalam pengantaran
        "completed", // Selesai
        "cancelled", // Dibatalkan
      ],
      default: "pending",
    },

    // ====== TRACKING ======
    tracking: {
      courierId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
        default: null,
      },
      courierName: { type: String, default: "" },
      pickupTime: { type: Date, default: null },
      deliveryTime: { type: Date, default: null },
      completedTime: { type: Date, default: null },
    },

    // ====== ADMIN ACTIONS ======
    adminActions: {
      confirmedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
        default: null,
      },
      confirmedAt: { type: Date, default: null },
      notes: { type: String, default: "" }, // Catatan admin
      cancellationReason: { type: String, default: "" },
    },
    editHistory: [
      {
        editedBy: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
        editedAt: { type: Date, default: Date.now },
        changes: {
          items: { type: Array, default: null },
          priceChanges: { type: Array, default: null },
          reason: { type: String },
        },
      },
    ],
    editedAt: { type: Date, default: null },
    editedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      default: null,
    },

    // ====== LOYALTY POINTS ======
    loyaltyPoints: {
      earned: { type: Number, default: 0 }, // Poin didapat dari order ini
      used: { type: Number, default: 0 }, // Poin digunakan (diskon)
      rate: { type: Number, default: 0.01 }, // Rate: 1% dari subtotal
    },
  },
  { timestamps: true }
);

export const Order =
  mongoose.models.Order || mongoose.model("Order", OrderSchema, "Order");
