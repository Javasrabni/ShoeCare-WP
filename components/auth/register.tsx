
// interface RegisterProps {
//     ButtonString: string
// }

const Register = () => {
    return (
        <form className="max-w-sm mx-auto">
            <div className="mb-5">
                <input type="text" id="name" className="bg-transparent border border-default-medium text-heading text-sm rounded-base focus:ring-brand focus:border-brand block w-full px-3 py-2.5 shadow-xs placeholder:text-body" placeholder="Nama Anda" required />
            </div>
            <div className="mb-5">
                <input type="email" id="email" className="bg-transparent border border-default-medium text-heading text-sm rounded-base focus:ring-brand focus:border-brand block w-full px-3 py-2.5 shadow-xs placeholder:text-body" placeholder="Email (Opsional)" />
            </div>
            <div className="mb-5">
                <input type="number" id="phone" className="bg-transparent border border-default-medium text-heading text-sm rounded-base focus:ring-brand focus:border-brand block w-full px-3 py-2.5 shadow-xs placeholder:text-body [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" placeholder="Nomor Telepon" onInput={(e) => {
                    const target = e.target as HTMLInputElement;
                    target.value = target.value.replace(/[^0-9]/g, '');
                }}
                    onPaste={(e) => {
                        const pasteData = e.clipboardData.getData('text');
                        if (/[^0-9]/.test(pasteData)) {
                            e.preventDefault();
                            const cleanData = pasteData.replace(/[^0-9]/g, '');
                            const target = e.target as HTMLInputElement;
                            target.value = cleanData;
                        }
                    }} required />
            </div>
            <div className="mb-5">
                <input type="password" id="password" className="bg-transparent border border-default-medium text-heading text-sm rounded-base focus:ring-brand focus:border-brand block w-full px-3 py-2.5 shadow-xs placeholder:text-body" placeholder="Kata Sandi" required />
            </div>
            <div className="mb-5">
                <input type="password" id="confirmPassword" className="bg-transparent border border-default-medium text-heading text-sm rounded-base focus:ring-brand focus:border-brand block w-full px-3 py-2.5 shadow-xs placeholder:text-body" placeholder="Konfirmasi Kata Sandi" required />
            </div>
            <label htmlFor="remember" className="flex items-center mb-5">
                <input id="remember" type="checkbox" className="w-4 h-4 border border-default-medium rounded-xs bg-transparent focus:ring-2 focus:ring-brand-soft" required />
                <p className="ms-2 text-sm font-medium text-heading select-none">Saya menyetujui <a href="#" className="text-fg-brand hover:underline">Syarat dan Ketentuan</a> serta <a href="#" className="text-fg-brand hover:underline">Kebijakan Privasi</a> ShoeCare.</p>
            </label>
            <button type="submit" className="text-white bg-blue-500 box-border border border-transparent hover:bg-brand-strong focus:ring-4 focus:ring-brand-medium shadow-xs font-medium leading-5 rounded-base text-sm px-4 py-2.5 w-full cursor-pointer focus:outline-none">Daftar</button>
        </form>


    )
}

export default Register
