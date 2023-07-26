export const getSilenced = ({ silence }: any = {}, code: string | number): boolean =>
    Array.isArray(silence) ? silence.includes(code) : !!silence;
