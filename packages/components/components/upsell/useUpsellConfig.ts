import { APPS } from '@proton/shared/lib/constants';
import { isElectronMail } from '@proton/shared/lib/helpers/desktop';
import { addUpsellPath, getUpgradePath } from '@proton/shared/lib/helpers/upsell';

import { useConfig, useFlag, useSubscriptionModal } from '../..';
import getUpsellSubscriptionModalConfig from './getUpsellSubscriptionModalConfig';

// Return config properties to inject in the upsell
const useUpsellConfig = (upsellRef: string) => {
    const [openSubscriptionModal] = useSubscriptionModal();
    const inboxUpsellFlowEnabled = useFlag('InboxUpsellFlow');
    const { APP_NAME } = useConfig();
    // Make sure the new upsell flow is never enabled for the account app in case the modal is used in multiple places
    const isAccount = APP_NAME === APPS.PROTONACCOUNT;

    if (!isAccount && !isElectronMail && inboxUpsellFlowEnabled) {
        // The subscription modal will open in inbox app
        return {
            upgradePath: '',
            onUpgrade() {
                openSubscriptionModal(getUpsellSubscriptionModalConfig(upsellRef));
            },
        };
    }

    // The user will be redirected to account app
    return {
        upgradePath: addUpsellPath(getUpgradePath({}), upsellRef),
    };
};

export default useUpsellConfig;
