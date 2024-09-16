import { type IconName } from '@proton/components/components/icon/Icon';

export interface UpsellFeature {
    getText: () => string;
    getTooltip?: () => string;
    icon: IconName;
}
