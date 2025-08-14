export const PROXY_IMG_URL = 'core/v4/images';

export const getImage = (Url: string, DryRun = 0, UID?: string) => ({
    method: 'get',
    url: PROXY_IMG_URL,
    params: { Url, DryRun, UID },
});

export type SenderImageMode = 'light' | 'dark';

export interface GetLogoParams {
    Address?: string;
    Domain?: string;
    Size?: number;
    BimiSelector?: string;
    Mode?: SenderImageMode;
    UID?: string;
}

/**
 * Get logo corresponding to address
 * @param Address encoded email address
 * @param Size The size of the logo to be returned, default 48
 * @returns
 */
export const getLogo = (params: GetLogoParams, output?: string) => ({
    method: 'get',
    url: 'core/v4/images/logo',
    output,
    params,
});
