export const getImage = (Url: string, DryRun = 0) => ({
    method: 'get',
    url: 'core/v4/images',
    params: { Url, DryRun },
});

export type SenderImageMode = 'light' | 'dark';

/**
 * Get logo corresponding to address
 * @param Address encoded email address
 * @param Size The size of the logo to be returned, default 48
 * @returns
 */
export const getLogo = (Address: string, Size?: number, BimiSelector?: string, Mode?: SenderImageMode) => ({
    method: 'get',
    url: 'core/v4/images/logo',
    params: { Address, Size, BimiSelector, Mode },
});
