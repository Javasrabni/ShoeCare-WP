"use client"
import { useState, useRef } from "react";
import { useToast } from "@/app/context/toast/toastContext";
// import TurnstileWidget from "./cloudflare/turnstileWidget";

const Register = () => {
    // Toast notification from context/toastContext.tsx
    const { showToast } = useToast();

    const [name, setName] = useState<string>('');
    const [email, setEmail] = useState<string>('');
    const [phone, setPhone] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [confirmPassword, setConfirmPassword] = useState<string>('');

    // const [captchaToken, setCaptchaToken] = useState<string | null>(null);
    // const turnstileRef = useRef<any>(null);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        try {


            // if (!captchaToken) {
            //     alert("Captcha belum diverifikasi");
            //     return;
            // }
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name: name.toLowerCase(), email, phone, password, passwordConfirm: confirmPassword }),
            });

            const data = await res.json();
            if (!res.ok) {
                showToast(data.message || 'Terjadi kesalahan saat mendaftar.', 'error');
                // turnstileRef.current?.reset();
                // setCaptchaToken(null);
                return;
            }
            setName('');
            setEmail('');
            setPhone('');
            setPassword('');
            setConfirmPassword('');
            // turnstileRef.current?.reset();
            // setCaptchaToken(null);
            showToast(data.message || 'Registrasi berhasil!', 'success');
            const delay = setTimeout(() => {
                window.location.reload();
            }, 2000);
            return () => clearTimeout(delay);
        } catch (error) {
            showToast('Terjadi kesalahan server.', 'error');
        }
    }

    return (
        <form className="max-w-sm m-auto">
            <div className="mb-5">
                <input type="text" id="name" className="bg-transparent border border-default-medium text-heading text-sm rounded-base focus:ring-brand focus:border-brand block w-full px-3 py-2.5 shadow-xs placeholder:text-body" placeholder="Nama Anda" required onChange={(e) => setName(e.target.value)} autoComplete="off" />
            </div>

            <div className="mb-5">
                <input type="tel" inputMode="numeric" id="phone" className="bg-transparent border border-default-medium text-heading text-sm rounded-base focus:ring-brand focus:border-brand block w-full px-3 py-2.5 shadow-xs placeholder:text-body [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" placeholder="Nomor Telepon (08..)" onInput={(e) => {
                    const target = e.target as HTMLInputElement;
                    target.value = target.value.replace(/[^0-9]/g, '');
                }}

                    onChange={(e) => setPhone(e.target.value)}
                    maxLength={13}
                    required autoComplete="off" />
            </div>

            <div className="mb-5">
                <input type="email" inputMode="email" id="email" className="bg-transparent border border-default-medium text-heading text-sm rounded-base focus:ring-brand focus:border-brand block w-full px-3 py-2.5 shadow-xs placeholder:text-body" placeholder="Email (Opsional)" onChange={(e) => setEmail(e.target.value)} autoComplete="off" />
            </div>

            <div className="mb-5">
                <input type="password" id="password" className="bg-transparent border border-default-medium text-heading text-sm rounded-base focus:ring-brand focus:border-brand block w-full px-3 py-2.5 shadow-xs placeholder:text-body" placeholder="Kata Sandi" required onChange={(e) => setPassword(e.target.value)} autoComplete="off" />
            </div>

            <div className="mb-5">
                <input type="password" id="confirmPassword" className="bg-transparent border border-default-medium text-heading text-sm rounded-base focus:ring-brand focus:border-brand block w-full px-3 py-2.5 shadow-xs placeholder:text-body" placeholder="Konfirmasi Kata Sandi" required onChange={(e) => setConfirmPassword(e.target.value)} autoComplete="off" />
            </div>

            <label htmlFor="remember" className="flex items-center mb-5">
                <input id="remember" type="checkbox" className="w-4 h-4 border border-default-medium rounded-xs bg-transparent focus:ring-2 focus:ring-brand-soft" required />
                <p className="ms-2 text-sm font-medium text-heading select-none">Saya menyetujui <a href="#" className="text-fg-brand hover:underline">Syarat dan Ketentuan</a> serta <a href="#" className="text-fg-brand hover:underline">Kebijakan Privasi</a> ShoeCare.</p>
            </label>
            {/* <div className="mb-5 flex justify-center">
                <TurnstileWidget onVerify={setCaptchaToken} />
            </div> */}
            <button type="submit" className="text-white bg-blue-500 box-border border border-transparent hover:bg-brand-strong focus:ring-4 focus:ring-brand-medium shadow-xs font-medium leading-5 rounded-base text-sm px-4 py-2.5 w-full cursor-pointer focus:outline-none" onClick={handleSubmit}>Daftar</button>
        </form>


    )
}

export default Register
