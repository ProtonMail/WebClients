import type { TipProps, TopNavbarOfferConfig } from '../../common/helpers/interface';

export type SUPPORTED_PRODUCTS = 'mail' | 'drive';

export type UnlimitedToDuoOfferConfig = TopNavbarOfferConfig<UnlimitedToDuoMessageType>;
export type UnlimitedToDuoTipProps = TipProps<UnlimitedToDuoMessageType>;

export enum UnlimitedToDuoMessageType {
    DoubleYourStorage = 'double-your-storage',
    ShareYourPlan = 'share-your-plan',
}
