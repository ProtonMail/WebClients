import type { ButtonLikeShape } from 'packages/atoms/src/Button/ButtonLike';

import type { Feature } from '@proton/components/containers/offers/interface';
import type { IconName, IconSize } from '@proton/icons/types';
import type { Currency } from '@proton/payments';

export interface OfferHookReturnValue {
    isLoading: boolean;
    isEligible: boolean;
    openSpotlight: boolean;
}

export interface TopNavbarOfferConfig<TMessageType = string> {
    type: TMessageType;
    title: string;
    features: Feature[];
    currency: Currency;
    price: number;
    topButton?: {
        shape?: ButtonLikeShape;
        gradient?: boolean;
        iconGradient?: boolean;
        iconSize?: IconSize;
        icon?: IconName;
        title: string;
        variant?: string;
    };
    loading: boolean;
}

export interface TipProps<TMessageType> {
    type: TMessageType;
    cta: string;
    spotlightTitle: string;
    features: Feature[];
}
