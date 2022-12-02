import { JSXElementConstructor, ReactNode } from 'react';

import type { FeatureCode, IconName } from '@proton/components';
import type { COUPON_CODES, CYCLE, PLANS } from '@proton/shared/lib/constants';
import type { Currency, Optional, PlanIDs } from '@proton/shared/lib/interfaces';

export type OfferId =
    | 'go-unlimited-2022'
    | 'special-offer-2022'
    | 'black-friday-mail-free-2022'
    | 'black-friday-mail-2022'
    | 'black-friday-mail-pro-2022'
    | 'black-friday-vpn-1-deal-2022'
    | 'black-friday-vpn-2-deal-2022'
    | 'black-friday-vpn-3-deal-2022';

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
}

export type OperationsMap = Record<OfferId, Operation>;

export interface OfferConfig {
    ID: OfferId;
    featureCode: FeatureCode;
    autoPopUp?: 'each-time' | 'one-time';
    canBeDisabled?: boolean;
    deals: Deal[];
    layout: JSXElementConstructor<OfferLayoutProps>;
    /** Displays countdown if present */
    periodEnd?: Date;
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
    ref: string;
    cycle: CYCLE;
    features?: () => Feature[];
    getCTAContent?: () => string;
    planIDs: PlanIDs; // planIDs used to subscribe
    planName: PLANS; // plan display in the deal
    popular?: boolean;
    header?: () => string | ReactNode;
    star?: string;
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
