import type { ButtonLikeShape } from '@proton/atoms/Button/ButtonLike';
import type { IconComponent } from '@proton/icons/component';
import type { IconSize } from '@proton/icons/types';
import type { Currency } from '@proton/payments/core/interface';

import type { Feature } from '../../../../../containers/offers/interface';

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
        icon?: IconComponent;
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
