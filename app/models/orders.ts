// app/models/orders.ts (pastikan schema lengkap)
import mongoose from "mongoose";

const OrderItemSchema = new mongoose.Schema({
  itemType: { type: String, required: true },
  treatmentType: { type: String, required: true },
  quantity: { type: Number, default: 1 },
  price: { type: Number, required: true },
  notes: { type: String, default: "" },
});

const StatusHistorySchema = new mongoose.Schema({
  status: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  updatedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "users",
    default: null 
  },
  updatedByName: { type: String, default: "" },
  notes: { type: String, default: "" },
  location: {
    lat: { type: Number, default: null },
    lng: { type: Number, default: null }
  }
});

const TrackingDetailSchema = new mongoose.Schema({
  stage: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  proofImage: { type: String, default: null },
  notes: { type: String, default: "" },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "users", default: null },
  updatedByName: { type: String, default: "" },
  location: {
    lat: { type: Number, default: null },
    lng: { type: Number, default: null }
  }
});

const OrderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, unique: true, required: true },
    customerInfo: {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "users", default: null },
      name: { type: String, required: true },
      phone: { type: String, required: true },
      isGuest: { type: Boolean, default: true },
    },
    serviceType: {
      type: String,
      enum: ["antar-jemput", "drop-point"],
      required: true,
    },
    pickupLocation: {
      address: { type: String, default: "" },
      coordinates: { 
        lat: { type: Number, required: true }, 
        lng: { type: Number, required: true } 
      },
      dropPointId: { type: mongoose.Schema.Types.ObjectId, ref: "DropPoint", default: null },
      dropPointName: { type: String, default: "" },
      distanceKM: { type: Number, default: 0 },
      deliveryFee: { type: Number, default: 0 },
    },
    items: [OrderItemSchema],
    payment: {
      method: { type: String, enum: ["qris", "transfer"], required: true },
      status: {
        type: String,
        enum: ["pending", "waiting_confirmation", "paid", "failed", "refunded"],
        default: "pending",
      },
      amount: { type: Number, required: true },
      subtotal: { type: Number, required: true },
      deliveryFee: { type: Number, default: 0 },
      discountPoints: { type: Number, default: 0 },
      finalAmount: { type: Number, required: true },
      proofImage: { type: String, default: null },
      paidAt: { type: Date, default: null },
      qrisData: { 
        qrString: { type: String, default: null }, 
        expiredAt: { type: Date, default: null } 
      },
    },
    status: {
      type: String,
      enum: [
        "pending",
        "waiting_confirmation", // ⬅️ TAMBAHKAN STATUS INI
        "confirmed",
        "courier_assigned",
        "pickup_in_progress",
        "picked_up",
        "in_workshop",
        "processing",
        "qc_check",
        "ready_for_delivery",
        "delivery_in_progress",
        "completed",
        "cancelled",
      ],
      default: "pending",
    },
    statusHistory: [StatusHistorySchema],
    tracking: {
      courierId: { type: mongoose.Schema.Types.ObjectId, ref: "users", default: null },
      courierName: { type: String, default: "" },
      pickupTime: { type: Date, default: null },
      deliveryTime: { type: Date, default: null },
      completedTime: { type: Date, default: null },
      trackingDetails: [TrackingDetailSchema],
      currentStage: { type: String, default: "" },
    },
    adminActions: {
      confirmedBy: { type: mongoose.Schema.Types.ObjectId, ref: "users", default: null },
      confirmedAt: { type: Date, default: null },
      notes: { type: String, default: "" },
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
    loyaltyPoints: {
      earned: { type: Number, default: 0 },
      used: { type: Number, default: 0 },
      rate: { type: Number, default: 0.01 },
    },
  },
  { timestamps: true }
);

export const Order = mongoose.models.Order || mongoose.model("Order", OrderSchema, "Order");