import type { ReactNode } from 'react';
import { createContext, useContext } from 'react';

import type { Breakpoints } from '@proton/components';
import { getHas2025OfferCoupon } from '@proton/payments';
import { APPS, type APP_NAMES } from '@proton/shared/lib/constants';
import { Audience } from '@proton/shared/lib/interfaces';
import { ThemeTypes } from '@proton/shared/lib/themes/constants';

import type { SignupParameters2 } from '../single-signup-v2/interface';

export interface SignupV2Theme {
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

const SignupV2ThemeContext = createContext<SignupV2Theme>(defaultValue);

export const getSignupV2Theme = (
    toApp: APP_NAMES | undefined,
    audience: Audience,
    viewportWidth: Breakpoints['viewportWidth'],
    signupParameters: SignupParameters2,
    searchParams?: URLSearchParams
): SignupV2Theme => {
    const darkTheme =
        getHas2025OfferCoupon(signupParameters.coupon) || (searchParams && searchParams.get('theme') === 'dark');
    if (darkTheme) {
        return {
            type: ThemeTypes.Storefront,
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

export const SignupV2ThemeProvider = ({ value, children }: { value: SignupV2Theme; children: ReactNode }) => {
    return <SignupV2ThemeContext.Provider value={value}>{children}</SignupV2ThemeContext.Provider>;
};

export const useSignupV2Theme = () => {
    return useContext(SignupV2ThemeContext);
};
