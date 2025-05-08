import * as useShowUpsellBannerModule from 'proton-mail/hooks/useShowUpsellBanner';

import * as useAutoDeleteBannerModule from './banners/auto-delete/useAutodeleteBanner';

export const mockUseAutoDeleteBanner = (value?: Partial<ReturnType<typeof useAutoDeleteBannerModule.default>>) => {
    const mockedUseAutoDeleteBanner = jest.spyOn(useAutoDeleteBannerModule, 'default');

    mockedUseAutoDeleteBanner.mockReturnValue(value ?? 'hide');

    return mockedUseAutoDeleteBanner;
};

export const mockUseShowUpsellBanner = (value?: Partial<ReturnType<typeof useShowUpsellBannerModule.default>>) => {
    const mockedUseShowUpsellBanner = jest.spyOn(useShowUpsellBannerModule, 'default');

    mockedUseShowUpsellBanner.mockReturnValue({
        canDisplayUpsellBanner: false,
        needToShowUpsellBanner: { current: false },
        handleDismissBanner: jest.fn(),
        ...value,
    });

    return mockedUseShowUpsellBanner;
};
