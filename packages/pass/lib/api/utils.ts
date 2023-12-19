export const API_BODYLESS_STATUS_CODES = [101, 204, 205, 304];

export const getSilenced = ({ silence }: any = {}, code: string | number): boolean =>
    Array.isArray(silence) ? silence.includes(code) : !!silence;

export const isPassSessionRoute = (url?: string): boolean => Boolean(url?.startsWith('pass/v1/user/session/lock'));
