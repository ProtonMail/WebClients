export const getImage = (Url: string, DryRun = 0) => ({
    method: 'get',
    url: 'core/v4/images',
    params: { Url, DryRun },
});

/**
 * Get logo corresponding to address
 * @param Address encoded email address
 * @param Size The size of the logo to be returned, default 48
 * @returns
 */
export const getLogo = (Address: string, Size?: number) => ({
    method: 'get',
    url: 'core/v4/images/logo',
    params: { Address, Size },
});
