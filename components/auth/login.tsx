"use client"
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/app/context/toast/toastContext";
import { useSpinner } from "@/app/context/spinner/spinnerContext";
const Login = () => {
    const router = useRouter();
    const { showToast } = useToast();
    const { showSpinner, hideSpinner } = useSpinner();
    const [identifier, setIdentifier] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [role, setRole] = useState<string>('');

    const [acceptTerms, setAcceptTerms] = useState<boolean>(false);

    async function handleLogin(e: React.FormEvent) {
        e.preventDefault();

        try {
            if(!acceptTerms) {
                showToast('Anda harus menyetujui Syarat dan Ketentuan serta Kebijakan Privasi ShoeCare.', 'error');
                return;
            }

            showSpinner("Sedang memproses...");
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ identifier, password, role }),
            });

            const data = await res.json();
            if (!res.ok) {
                showToast(data.message || 'Terjadi kesalahan saat login.', 'error');
                return;
            }
            // showToast(data.message || 'Login berhasil!', 'success');
            // const delay = setTimeout(() => {
            //     window.location.reload();
            // }, 1500);
            hideSpinner();
            router.push('/layanan');

            // return () => clearTimeout(delay);
        } catch (error) {
            showToast('Terjadi kesalahan server.', 'error');
        } finally {
            hideSpinner();
        }
    }
    return (
        <form className="max-w-sm mx-auto">
            <div className="mb-5">
                <input type="text" id="text" className="bg-transparent border border-default-medium text-heading text-sm rounded-base focus:ring-brand focus:border-brand block w-full px-3 py-2.5 shadow-xs placeholder:text-body" inputMode="text" placeholder="Masukkan Nomor Telepon atau Email" required onChange={(e) => setIdentifier(e.target.value)} value={identifier} />
            </div>
            <div className="mb-5">
                <input type="password" id="password" className="bg-transparent border border-default-medium text-heading text-sm rounded-base focus:ring-brand focus:border-brand block w-full px-3 py-2.5 shadow-xs placeholder:text-body" placeholder="Masukkan Kata Sandi" required onChange={(e) => setPassword(e.target.value)} value={password} />
            </div>
            <div className="mb-5">
                <select className="bg-transparent border border-default-medium text-heading text-sm rounded-base focus:ring-brand focus:border-brand block w-full px-3 py-2.5 shadow-xs" onChange={(e) => setRole(e.target.value)} value={role} required>
                    <option value="" disabled>Masuk sebagai</option>
                    <option value="customer">Member ShoeCare</option>
                    <option value="admin" disabled>Admin</option>
                    <option value="dropper" disabled>Dropper</option>
                    <option value="courier" disabled>Courier</option>
                    <option value="technician" disabled>Technician</option>
                    <option value="qc" disabled>QC</option>
                </select>
                <div className="text-sm text-body hover:text-heading cursor-pointer mt-4 text-center underline">Lupa Kata Sandi?</div>
            </div>


            <label htmlFor="remember" className="flex items-center mb-5">
                <input id="remember" type="checkbox" className="w-4 h-4 border border-default-medium rounded-xs bg-transparent focus:ring-2 focus:ring-brand-soft" required onChange={(e) => setAcceptTerms(e.target.checked)} />
                <p className="ms-2 text-sm font-medium text-heading select-none">Saya menyetujui <a href="#" className="text-fg-brand hover:underline">Syarat dan Ketentuan</a> serta <a href="#" className="text-fg-brand hover:underline">Kebijakan Privasi</a> ShoeCare.</p>
            </label>
            <button type="submit" onClick={handleLogin} className="text-white bg-blue-500 box-border border border-transparent hover:bg-brand-strong focus:ring-4 shadow-xs font-medium leading-5 rounded-base text-sm px-4 py-2.5 w-full cursor-pointer focus:outline-none">Login</button>
        </form>


    )
}

export default Login
