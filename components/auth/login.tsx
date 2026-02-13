// interface LoginProps {
//     ButtonString: string
// }

const Login = () => {
    return (
        <form className="max-w-sm mx-auto">
            <div className="mb-5">
                <input type="text" id="text" className="bg-transparent border border-default-medium text-heading text-sm rounded-base focus:ring-brand focus:border-brand block w-full px-3 py-2.5 shadow-xs placeholder:text-body" inputMode="text" placeholder="Masukkan Nomor Telepon atau Email" required />
            </div>
            <div className="mb-5">
                <input type="password" id="password" className="bg-transparent border border-default-medium text-heading text-sm rounded-base focus:ring-brand focus:border-brand block w-full px-3 py-2.5 shadow-xs placeholder:text-body" placeholder="Masukkan Kata Sandi" required />
            </div>
            <div className="mb-5">
                <select id="remember" defaultValue={''} className="bg-transparent border border-default-medium text-heading text-sm rounded-base focus:ring-brand focus:border-brand block w-full px-3 py-2.5 shadow-xs">
                    <option value="" disabled>Masuk sebagai</option>
                    <option value="customer">Customer</option>
                    <option value="admin">Admin</option>
                    <option value="dropper">Dropper</option>
                    <option value="courier">Courier</option>
                    <option value="technician">Technician</option>
                    <option value="qc">QC</option>
                </select>
                <div className="text-sm text-body hover:text-heading cursor-pointer mt-4 text-center underline">Lupa Kata Sandi?</div>
            </div>


            <label htmlFor="remember" className="flex items-center mb-5">
                <input id="remember" type="checkbox" className="w-4 h-4 border border-default-medium rounded-xs bg-transparent focus:ring-2 focus:ring-brand-soft" required />
                <p className="ms-2 text-sm font-medium text-heading select-none">Saya menyetujui <a href="#" className="text-fg-brand hover:underline">Syarat dan Ketentuan</a> serta <a href="#" className="text-fg-brand hover:underline">Kebijakan Privasi</a> ShoeCare.</p>
            </label>
            <button type="submit" className="text-white bg-blue-500 box-border border border-transparent hover:bg-brand-strong focus:ring-4 focus:ring-brand-medium shadow-xs font-medium leading-5 rounded-base text-sm px-4 py-2.5 w-full cursor-pointer focus:outline-none">Login</button>
        </form>


    )
}

export default Login
