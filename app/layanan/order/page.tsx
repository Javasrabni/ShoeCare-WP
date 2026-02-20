// app/layanan/order/page.tsx
import { redirect } from "next/navigation"

export default function OrderPage() {
    redirect("/layanan/order/steps/1-pilih-layanan")
}