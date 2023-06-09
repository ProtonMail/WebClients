import type { ApiOptions } from '../types';

export const withResponseMapper = <
    T = ApiOptions,
    F = T extends ApiOptions<any, any, infer U> ? U : (response: any) => Promise<any>
>(
    options: T,
    mapResponse: F
): T & { mapResponse: F } => ({ ...options, mapResponse });

export const getSilenced = ({ silence }: any = {}, code: string | number): boolean =>
    Array.isArray(silence) ? silence.includes(code) : !!silence;
