import type { JSXElementConstructor, ReactNode } from 'react';

import type { ButtonLikeShape, ButtonLikeSize } from '@proton/atoms/Button/ButtonLike';
import type { FeatureCode } from '@proton/features';
import type { IconName, IconSize } from '@proton/icons/types';
import type { COUPON_CODES, CYCLE, Currency, PlanIDs } from '@proton/payments';
import type { Optional } from '@proton/shared/lib/interfaces';

import type { SpringSale2026OfferId } from './operations/springSale2026offers';

export type OfferId = 'go-unlimited-2022' | 'mail-trial-2023' | 'pass-family-plan-2024-yearly' | SpringSale2026OfferId;

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

export interface OfferDealSaveSentenceType {
    sentenceSaveType?: 'switch-yearly' | 'limited-time-deal';
}

export interface OfferConfig {
    ID: OfferId;
    featureCode: FeatureCode;
    autoPopUp?: 'each-time' | 'one-time';
    title?: () => string;
    subTitle?: () => string;
    canBeDisabled?: boolean;
    deals: Deal[];
    layout: JSXElementConstructor<OfferLayoutProps>;
    /** Displays countdown if present */
    periodEnd?: Date;
    topButton?: {
        shape?: ButtonLikeShape;
        gradient?: boolean;
        iconGradient?: boolean;
        iconSize?: IconSize;
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

export interface Feature {
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
    isLifeTime?: boolean;
    features?: () => Feature[];
    getCTAContent?: () => string;
    buttonSize?: ButtonLikeSize;
    planIDs: PlanIDs; // planIDs used to subscribe
    dealName: string; // most of the time we show the plan name of the deal
    renew?: string; // Renew description to display in the footer
    popular?: number; // 1 = most popular, 2 = second most popular, etc.
    mobileOrder?: number; // 1 = most popular, 2 = second most popular, etc. if using this, please specify it for all plans to avoid issues
    header?: () => string | ReactNode;
    star?: string;
    isGuaranteed?: boolean;
    dealSuffixPrice?: () => string;
    suffixOnNewLine?: boolean;
    /** to replace "Save xxx%", better use a short text */
    bubbleText?: string;
    sentence?: string;
    sentenceSaveType?: 'switch-yearly' | 'switch-two-year' | 'limited-time-deal';
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
