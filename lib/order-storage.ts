// lib/order-storage.ts
export const ORDER_STORAGE_KEY = "shoecare_order_draft"
export const PENDING_ORDER_KEY = "shoecare_pending_order"

export interface OrderDraft {
  step: number
  serviceType?: "antar-jemput" | "drop-point"
  customerLocation?: {
    lat: number
    lng: number
    address: string
  }
  selectedDropPoint?: any
  dropPointResult?: any
  customerInfo?: {
    name: string
    phone: string
    address: string
    notes?: string
  }
  items?: any[]
  paymentMethod?: "qris" | "transfer"
  useLoyaltyPoints?: number
  subtotal?: number
  deliveryFee?: number
  discount?: number
  total?: number
  timestamp: string
}

export function getOrderDraft(): OrderDraft | null {
  if (typeof window === "undefined") return null
  try {
    const saved = localStorage.getItem(ORDER_STORAGE_KEY)
    return saved ? JSON.parse(saved) : null
  } catch {
    return null
  }
}

export function saveOrderDraft(data: Partial<OrderDraft>) {
  const existing = getOrderDraft()
  const updated = {
    ...(existing || { step: 1, timestamp: new Date().toISOString() }),
    ...data,
    timestamp: new Date().toISOString()
  }
  localStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(updated))
  return updated
}

export function clearOrderDraft() {
  if (typeof window !== "undefined") {
    localStorage.removeItem(ORDER_STORAGE_KEY)
  }
}

export function isOrderDraftExpired(maxAgeHours: number = 24): boolean {
  const draft = getOrderDraft()
  if (!draft) return false
  
  const created = new Date(draft.timestamp)
  const now = new Date()
  const diffHours = (now.getTime() - created.getTime()) / (1000 * 60 * 60)
  
  return diffHours > maxAgeHours
}