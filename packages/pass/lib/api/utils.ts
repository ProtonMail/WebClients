export const getSilenced = ({ silence }: any = {}, code: string | number): boolean =>
    Array.isArray(silence) ? silence.includes(code) : !!silence;

export const isPassSessionRoute = (url?: string): boolean => Boolean(url?.startsWith('pass/v1/user/session/lock'));
