// Helper untuk membatasi angka di belakang koma (maks 8 digit)
export const formatDecimal = (value: any, precision = 8) => {
    if (value === undefined || value === null || value === "") return null;
    const num = Number(value); // parse string → number
    if (isNaN(num)) return null;
    return Number(num.toFixed(precision));
};