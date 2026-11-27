import { useEntitlementChecksForOrgAndUser } from '@proton/account/entitlementCatalog/hooks';
import { useUser } from '@proton/account/user/hooks';
import type { APP_NAMES } from '@proton/shared/lib/constants';

import SettingsSectionWide from '../../account/SettingsSectionWide';
import PassOrgSetupChecklistSection from './PassOrgSetupChecklistSection';
import { getPassOrgSetupStepIds, getShowPassOrgSetupChecklist } from './interface';

interface Props {
    app: APP_NAMES;
}

const PassB2BDashboardOnboarding = ({ app }: Props) => {
    const [user] = useUser();
    const [entitlements, loadingEntitlements] = useEntitlementChecksForOrgAndUser();

    if (loadingEntitlements || !getShowPassOrgSetupChecklist({ app, isAdmin: user.isAdmin, entitlements })) {
        return null;
    }

    return (
        <SettingsSectionWide>
            <PassOrgSetupChecklistSection stepIds={getPassOrgSetupStepIds(entitlements)} />
        </SettingsSectionWide>
    );
};

export default PassB2BDashboardOnboarding;
