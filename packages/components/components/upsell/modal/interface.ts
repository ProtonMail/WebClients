import { IconName } from '../../icon';

export interface UpsellFeature {
    getText: () => string;
    getTooltip?: () => string;
    icon: IconName;
}
