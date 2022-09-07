import { JSXElementConstructor } from 'react';

import type { FeatureCode, IconName } from '@proton/components';
import type { COUPON_CODES, CYCLE, PLANS } from '@proton/shared/lib/constants';
import type { Currency, PlanIDs } from '@proton/shared/lib/interfaces';

export type OfferId = 'go-unlimited-2022' | 'special-offer-2022';

export type OfferGlobalFeatureCodeValue = Record<OfferId, boolean>;

export enum OfferUserFeatureCodeValue {
    Default = 0,
    Visited = 1,
    Hide = 2,
}

export interface OfferLayoutProps {
    currency: Currency;
    offer: Offer;
    onChangeCurrency: (currency: Currency) => void;
    onSelectDeal: (offer: Offer, deal: Deal, current: Currency) => void;
    onCloseModal: () => void;
}

export interface Operation {
    config: OfferConfig;
    isValid: boolean;
    isLoading: boolean;
}

export type OperationsMap = Record<OfferId, Operation>;

export interface OfferConfig {
    ID: OfferId;
    featureCode: FeatureCode;
    ref: string;
    autoPopUp?: boolean;
    canBeDisabled?: boolean;
    deals: Deal[];
    layout: JSXElementConstructor<OfferLayoutProps>;
    /** Displays countdown if present */
    periodEnd?: number;
    getCTAContent?: () => string;
}

interface Feature {
    disabled?: boolean;
    icon?: IconName;
    name: string;
    tooltip?: string;
}

export interface Deal {
    couponCode?: COUPON_CODES;
    cycle: CYCLE;
    features?: Feature[];
    getCTAContent?: () => string;
    planIDs: PlanIDs; // planIDs used to subscribe
    planName: PLANS; // plan display in the deal
    popular?: boolean;
}

interface Prices {
    withCoupon: number;
    withoutCoupon: number;
    withoutCouponMonthly: number;
}

export interface Offer extends OfferConfig {
    deals: (Deal & { prices: Prices })[];
}
