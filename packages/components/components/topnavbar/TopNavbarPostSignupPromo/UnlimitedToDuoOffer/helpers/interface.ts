import type { TipProps, TopNavbarOfferConfig } from '../../common/helpers/interface';

export type SUPPORTED_PRODUCTS = 'mail' | 'drive';
export const MINIMUM_DAYS_SUBSCRIBED_TO_UNLIMITED = 7;

export type UnlimitedToDuoOfferConfig = TopNavbarOfferConfig<UnlimitedToDuoMessageType>;
export type UnlimitedToDuoTipProps = TipProps<UnlimitedToDuoMessageType>;

export enum UnlimitedToDuoMessageType {
    DoubleYourStorage = 'double-your-storage',
    ShareYourPlan = 'share-your-plan',
}
