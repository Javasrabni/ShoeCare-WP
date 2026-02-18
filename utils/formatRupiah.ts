// utils/formatRupiah.ts
export const formatRupiah = (angka: number | string | null | undefined): string => {
    if (!angka) return "Rp0";
    
    const number = typeof angka === 'string' ? parseInt(angka.replace(/\D/g, '')) || 0 : angka;
    
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(number);
};

// Untuk input (hanya angka dengan pemisah)
export const formatNumberInput = (value: string): string => {
    const number = value.replace(/\D/g, '');
    return number.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

// Parse dari format input ke number
export const parseRupiahToNumber = (value: string): number => {
    return parseInt(value.replace(/\./g, '')) || 0;
};