"use client";
import { useState } from 'react';
import Login from '@/components/auth/login'
import Register from '@/components/auth/register';

const AuthClient = () => {
    const [formState, setFormState] = useState<boolean>(true);

    return (
        <div className='flex flex-col gap-4 h-full py-16'>
            <div className="relative bg-neutral-secondary-medium rounded-lg flex p-1 h-12 items-center">
                {/* Elemen Sliding Background */}
                <div
                    className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white rounded-md shadow-sm transition-all duration-300 ease-in-out ${formState ? 'left-1' : 'left-[calc(50%+1px)]'
                        }`}
                />

                {/* Tombol Login */}
                <button
                    className={`relative z-10 w-1/2 py-2 text-sm font-medium transition-colors duration-300 cursor-pointer ${formState ? 'text-heading' : 'text-body'
                        }`}
                    onClick={() => setFormState(true)}
                >
                    Login
                </button>

                {/* Tombol Daftar */}
                <button
                    className={`relative z-10 w-1/2 py-2 text-sm font-medium transition-colors duration-300 cursor-pointer  ${!formState ? 'text-heading' : 'text-body'
                        }`}
                    onClick={() => setFormState(false)}
                >
                    Daftar Akun (Customer)
                </button>
            </div>

            {/* Konten Form */}
            <div className="mt-2">
                {formState ? <Login /> : <Register />}
            </div>
            
        </div>
    )
}

export default AuthClient
