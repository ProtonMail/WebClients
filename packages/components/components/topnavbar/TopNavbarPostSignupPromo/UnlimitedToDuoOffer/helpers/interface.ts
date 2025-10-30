import type { TipProps, TopNavbarOfferConfig } from '../../common/helpers/interface';

export type SUPPORTED_PRODUCTS = 'mail' | 'drive';
export const MINIMUM_DAYS_SUBSCRIBED_TO_UNLIMITED = 7;
export const MAX_DAYS_TO_SHOW_SAME_TIP = 30;

export type UnlimitedToDuoOfferConfig = TopNavbarOfferConfig<UnlimitedToDuoMessageType>;
export type UnlimitedToDuoTipProps = TipProps<UnlimitedToDuoMessageType>;

export enum UnlimitedToDuoMessageType {
    GetFourTimesMoreStorage = 'get-four-times-more-storage',
    ShareYourPlan = 'share-your-plan',
}

export interface UnlimitedToDuoRotationState {
    tipIndex: number;
    rotationDate: number;
}
