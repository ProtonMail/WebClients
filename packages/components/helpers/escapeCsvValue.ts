export const escapeCsvValue = (value: string | number | undefined | null) => {
    const str = String(value ?? '');
    return `"${str.replace(/"/g, '""')}"`;
};