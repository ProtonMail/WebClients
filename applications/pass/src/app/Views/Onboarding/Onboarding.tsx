import { type FC } from 'react';
import { useSelector } from 'react-redux';

import { BusinessOnboardingPanel } from '@proton/pass/components/B2BOnboarding/BusinessOnboardingPanel';
import { useItems } from '@proton/pass/components/Item/Context/ItemsProvider';
import { SubSidebar } from '@proton/pass/components/Layout/Section/SubSidebar';
import { useNavigation } from '@proton/pass/components/Navigation/NavigationProvider';
import { VaultActionsProvider } from '@proton/pass/components/Vault/VaultActionsProvider';
import { selectAllVaults, selectPassPlan } from '@proton/pass/store/selectors';
import { UserPassPlan } from '@proton/pass/types/api/plan';

export const Onboarding: FC = () => {
    /* TODO redirect to list view if normal onboarding */
    const { matchTrash } = useNavigation();
    const activeOnboarding = true;
    const { totalCount } = useItems();

    const hasMultipleVaults = useSelector(selectAllVaults).length > 1;
    const plan = useSelector(selectPassPlan);

    const empty = totalCount === 0;
    if ((plan === UserPassPlan.BUSINESS && empty && !hasMultipleVaults && !matchTrash) || activeOnboarding) {
        return (
            <SubSidebar>
                <VaultActionsProvider>
                    <BusinessOnboardingPanel />
                </VaultActionsProvider>
            </SubSidebar>
        );
    }
};
