import type { MutableRefObject } from 'react';

import { useOrganization } from '@proton/account/organization/hooks';
import { AdminRolesUIState, useAdminRolesUI } from '@proton/account/userPermissions/hooks';
import { FeatureCode, useFeature } from '@proton/features';
import { APPS, type APP_NAMES } from '@proton/shared/lib/constants';
import { useFlag } from '@proton/unleash/useFlag';

import useModalState from '../../../components/modalTwo/useModalState';
import SettingsParagraph from '../../account/SettingsParagraph';
import SettingsSectionWide from '../../account/SettingsSectionWide';
import DomainModal from '../../domains/DomainModal';
import ScimSetupBannerAndModal from '../../organization/ScimSetupBannerAndModal';
import useOrganizationModals from '../../organization/useOrganizationModals';
import useOrganizationUnprivatizationModals from '../../organization/useOrganizationUnprivatizationModals';
import AdminRolesOnboardingModal from '../rolesAndPermissions/AdminRolesOnboardingModal';
import { MembersLocal } from './MembersLocal';
import { MembersRemote } from './MembersRemote';
import UserAndAddressesSectionIntro from './UserAndAddressesSectionIntro';
import { planHasUsageColumns } from './planHasUsageColumns';

const paginatedMemberThreshold = 250;

const UsersAndAddressesSection = ({ app, onceRef }: { app: APP_NAMES; onceRef: MutableRefObject<boolean> }) => {
    const organizationModals = useOrganizationModals(onceRef);
    const organizationUnprivatizationModals = useOrganizationUnprivatizationModals();
    const [organization] = useOrganization();
    const hasRemoteMembers = useFlag('MembersRemote');
    const hasVpnUserActivity = useFlag('VpnB2bUserActivity');
    // The members-usage endpoint caps the request at 250 IDs, and only the paginated MembersRemote path
    // keeps it bounded. So only show usage when the member set stays within that cap (or is paginated);
    // otherwise a large org on the non-paginated path would send >250 IDs and the request would be rejected.
    const withinUsageBounds =
        hasRemoteMembers || (organization?.UsedMembers ?? Number.POSITIVE_INFINITY) <= paginatedMemberThreshold;
    const showUsage =
        app === APPS.PROTONVPN_SETTINGS &&
        hasVpnUserActivity &&
        planHasUsageColumns(organization?.PlanName) &&
        withinUsageBounds;
    const [adminRolesUIState] = useAdminRolesUI();
    const [newDomainModalProps, setNewDomainModalOpen, renderNewDomain] = useModalState();
    const {
        feature: adminRolesModalFeature,
        update: updateAdminRolesModal,
        loading: adminRolesModalLoading,
    } = useFeature(FeatureCode.AdminRolesOnboardingModal, adminRolesUIState === AdminRolesUIState.Enabled);

    const canShowAdminRolesModal =
        adminRolesUIState === AdminRolesUIState.Enabled && !adminRolesModalLoading && !!adminRolesModalFeature?.Value;

    return (
        <SettingsSectionWide customWidth={showUsage ? '100%' : undefined}>
            <SettingsParagraph large className="flex items-center mb-12 gap-2">
                <UserAndAddressesSectionIntro onOpenNewDomainModal={setNewDomainModalOpen} />
            </SettingsParagraph>

            {organizationModals.info}

            {organizationUnprivatizationModals.memberInfo}
            {organizationModals.modals}

            <ScimSetupBannerAndModal />

            {organization && organization.UsedMembers > paginatedMemberThreshold && hasRemoteMembers ? (
                <MembersRemote app={app} showUsage={showUsage} />
            ) : (
                <MembersLocal app={app} showUsage={showUsage} />
            )}
            {renderNewDomain && <DomainModal {...newDomainModalProps} />}
            <AdminRolesOnboardingModal
                variant="member"
                open={canShowAdminRolesModal}
                onClose={() => {
                    void updateAdminRolesModal(false);
                }}
            />
        </SettingsSectionWide>
    );
};

export default UsersAndAddressesSection;
