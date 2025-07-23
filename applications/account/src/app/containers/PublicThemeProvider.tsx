import type { ReactNode } from 'react';
import { createContext, useContext } from 'react';

import type { Breakpoints } from '@proton/components';
import { getHas2024OfferCoupon } from '@proton/payments';
import { APPS, type APP_NAMES } from '@proton/shared/lib/constants';
import { Audience } from '@proton/shared/lib/interfaces';
import { ThemeTypes } from '@proton/shared/lib/themes/constants';

import type { SignupParameters2 } from '../single-signup-v2/interface';

export interface PublicTheme {
    type?: ThemeTypes;
    background?: 'bf' | 'b2b' | 'lumo';
    intent: APP_NAMES | undefined;
    dark: boolean;
    card: {
        className: string;
    };
    layout: {
        className: string;
    };
}

const defaultValue = {
    type: ThemeTypes.Storefront,
    intent: undefined,
    dark: false,
    card: {
        className: 'ui-standard',
    },
    layout: {
        className: '',
    },
};

const PublicThemeContext = createContext<PublicTheme>(defaultValue);

export const getPublicTheme = (
    toApp: APP_NAMES | undefined,
    audience: Audience,
    viewportWidth: Breakpoints['viewportWidth'],
    signupParameters: SignupParameters2
): PublicTheme => {
    const darkTheme = getHas2024OfferCoupon(signupParameters.coupon);
    if (darkTheme) {
        return {
            type: ThemeTypes.Carbon,
            background: 'bf',
            intent: toApp,
            dark: true,
            card: {
                className: viewportWidth.xsmall ? 'ui-prominent' : defaultValue.card.className,
            },
            layout: {
                className: 'ui-prominent',
            },
        };
    }

    if (toApp === APPS.PROTONWALLET) {
        return {
            ...defaultValue,
            type: ThemeTypes.StorefrontWallet,
            intent: toApp,
        };
    }

    if (audience === Audience.B2B) {
        return {
            type: ThemeTypes.Storefront,
            background: 'b2b',
            intent: toApp,
            dark: true,
            card: {
                className: viewportWidth.xsmall ? 'ui-prominent' : defaultValue.card.className,
            },
            layout: {
                className: 'ui-prominent',
            },
        };
    }

    return {
        ...defaultValue,
        intent: toApp,
    };
};

export const PublicThemeProvider = ({ value, children }: { value: PublicTheme; children: ReactNode }) => {
    return <PublicThemeContext.Provider value={value}>{children}</PublicThemeContext.Provider>;
};

export const usePublicTheme = () => {
    return useContext(PublicThemeContext);
};
