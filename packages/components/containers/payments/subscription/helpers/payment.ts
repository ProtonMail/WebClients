import { PLANS } from '@proton/payments';
import type { ProductParam } from '@proton/shared/lib/apps/product';
import { APPS } from '@proton/shared/lib/constants';
import { Audience } from '@proton/shared/lib/interfaces';

export const getDefaultSelectedProductPlans = ({ appName, plan }: { appName: ProductParam; plan?: string }) => {
    let defaultB2CPlan = PLANS.MAIL;
    if (appName === APPS.PROTONVPN_SETTINGS) {
        defaultB2CPlan = PLANS.VPN2024;
    } else if (appName === APPS.PROTONDRIVE || appName === APPS.PROTONDOCS) {
        defaultB2CPlan = PLANS.DRIVE;
    } else if (appName === APPS.PROTONPASS || appName === APPS.PROTONAUTHENTICATOR) {
        defaultB2CPlan = PLANS.PASS;
    } else if (appName === APPS.PROTONLUMO) {
        defaultB2CPlan = PLANS.LUMO;
    }

    const matchingB2CPlan = [PLANS.MAIL, PLANS.VPN2024, PLANS.DRIVE].find((planName) => plan === planName);
    const matchingB2BPlan = [PLANS.MAIL_PRO, PLANS.DRIVE_PRO].find((planName) => plan === planName);
    const defaultB2BPlan = PLANS.MAIL_PRO;
    return {
        [Audience.B2C]: matchingB2CPlan || defaultB2CPlan,
        [Audience.B2B]: matchingB2BPlan || defaultB2BPlan,
        [Audience.FAMILY]: PLANS.FAMILY,
    };
};
export type SelectedProductPlans = ReturnType<typeof getDefaultSelectedProductPlans>;
