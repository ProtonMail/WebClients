import type { JSXElementConstructor, ReactNode } from 'react';

import type { ButtonLikeShape, ButtonLikeSize } from '@proton/atoms/Button';
import type { FeatureCode, IconName } from '@proton/components';
import type { COUPON_CODES, CYCLE } from '@proton/shared/lib/constants';
import type { Currency, Optional, PlanIDs } from '@proton/shared/lib/interfaces';

export type OfferId =
    // This offer runs all the time and is used to remind users to upgrade once their account is old enough
    | 'subscription-reminder'
    | 'duo-plan-2024-yearly'
    | 'duo-plan-2024-two-years'
    | 'go-unlimited-2022'
    | 'mail-trial-2023'
    | 'mail-trial-2024'
    | 'black-friday-2023-inbox-free'
    | 'black-friday-2023-inbox-mail'
    | 'black-friday-2023-inbox-unlimited'
    | 'black-friday-2023-vpn-free'
    | 'black-friday-2023-vpn-monthly'
    | 'black-friday-2023-vpn-yearly'
    | 'black-friday-2023-vpn-two-years'
    | 'black-friday-2023-drive-free'
    | 'black-friday-2023-drive-plus'
    | 'black-friday-2023-drive-unlimited';

export type OfferGlobalFeatureCodeValue = Record<OfferId, boolean>;

export enum OfferUserFeatureCodeValue {
    Default = 0,
    Visited = 1,
    Hide = 2,
}

export interface OfferProps {
    currency: Currency;
    offer: Offer;
    onChangeCurrency: (currency: Currency) => void;
    onSelectDeal: (offer: Offer, deal: Deal, current: Currency) => void;
    onCloseModal: () => void;
}

export type OfferLayoutProps = Optional<OfferProps, 'offer'>;

export interface Operation {
    config: OfferConfig;
    isValid: boolean;
    isLoading: boolean;
    isEligible: boolean;
    isUsingMoreThan80PercentStorage?: boolean;
}

export interface OfferImages {
    sideImage?: string;
    sideImage2x?: string;
    bannerImage?: string;
    bannerImage2x?: string;
}

export interface OfferConfig {
    ID: OfferId;
    featureCode: FeatureCode;
    autoPopUp?: 'each-time' | 'one-time';
    canBeDisabled?: boolean;
    deals: Deal[];
    layout: JSXElementConstructor<OfferLayoutProps>;
    /** Displays countdown if present */
    periodEnd?: Date;
    topButton?: {
        shape?: ButtonLikeShape;
        gradient?: boolean;
        iconGradient?: boolean;
        icon?: IconName;
        getCTAContent?: () => string;
        variant?: string;
    };
    images?: OfferImages;
    darkBackground?: boolean; // Will use a light close button if true (ghost button with white text)
    enableCycleSelector?: boolean; // Allow the selection of cycles if true in the checkout process
    /** only make sense for 1 plan offer and IF the plan title is above the plan card */
    hideDealTitle?: boolean;
    /** if you want to hide all "save xx%"" in the bubble on top of all plans */
    hideDiscountBubble?: boolean;
    hideDealPriceInfos?: boolean;
}

interface Feature {
    badge?: string;
    disabled?: boolean;
    icon?: IconName;
    name: string;
    tooltip?: string;
}

export interface Deal {
    couponCode?: COUPON_CODES;
    ref: string;
    cycle: CYCLE;
    features?: () => Feature[];
    getCTAContent?: () => string;
    buttonSize?: ButtonLikeSize;
    planIDs: PlanIDs; // planIDs used to subscribe
    dealName: string; // most of the time we show the plan name of the deal
    popular?: number; // 1 = most popular, 2 = second most popular, etc.
    mobileOrder?: number; // 1 = most popular, 2 = second most popular, etc. if using this, please specify it for all plans to avoid issues
    header?: () => string | ReactNode;
    star?: string;
    isGuaranteed?: boolean;
    dealSuffixPrice?: () => string;
    suffixOnNewLine?: boolean;
}

export interface Prices {
    withCoupon: number;
    withoutCoupon: number;
    withoutCouponMonthly: number;
}

export type DealWithPrices = Deal & { prices: Prices };

export interface Offer extends OfferConfig {
    deals: DealWithPrices[];
}

export interface DealProps extends Required<OfferProps> {
    deal: Offer['deals'][number];
}
