import type { MutableRefObject } from 'react';

import { useOrganization } from '@proton/account/organization/hooks';
import { AdminRolesUIState, useAdminRolesUI } from '@proton/account/userPermissions/hooks';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import SettingsParagraph from '@proton/components/containers/account/SettingsParagraph';
import SettingsSectionWide from '@proton/components/containers/account/SettingsSectionWide';
import DomainModal from '@proton/components/containers/domains/DomainModal';
import { FeatureCode, useFeature } from '@proton/features';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { useFlag } from '@proton/unleash/useFlag';

import ScimSetupBannerAndModal from '../../organization/ScimSetupBannerAndModal';
import useOrganizationModals from '../../organization/useOrganizationModals';
import useOrganizationUnprivatizationModals from '../../organization/useOrganizationUnprivatizationModals';
import AdminRolesOnboardingModal from '../rolesAndPermissions/AdminRolesOnboardingModal';
import { MembersLocal } from './MembersLocal';
import { MembersRemote } from './MembersRemote';
import UserAndAddressesSectionIntro from './UserAndAddressesSectionIntro';

const paginatedMemberThreshold = 250;

const UsersAndAddressesSection = ({ app, onceRef }: { app: APP_NAMES; onceRef: MutableRefObject<boolean> }) => {
    const organizationModals = useOrganizationModals(onceRef);
    const organizationUnprivatizationModals = useOrganizationUnprivatizationModals();
    const [organization] = useOrganization();
    const hasRemoteMembers = useFlag('MembersRemote');
    const [adminRolesUIState] = useAdminRolesUI();
    const [newDomainModalProps, setNewDomainModalOpen, renderNewDomain] = useModalState();
    const {
        feature: adminRolesModalFeature,
        update: updateAdminRolesModal,
        loading: adminRolesModalLoading,
    } = useFeature(FeatureCode.AdminRolesOnboardingModal, adminRolesUIState === AdminRolesUIState.Enabled);

    const canShowAdminRolesModal = !adminRolesModalLoading && !!adminRolesModalFeature?.Value;

    return (
        <SettingsSectionWide>
            <SettingsParagraph large className="flex items-center mb-12 gap-2">
                <UserAndAddressesSectionIntro onOpenNewDomainModal={setNewDomainModalOpen} />
            </SettingsParagraph>

            {organizationModals.info}

            {organizationUnprivatizationModals.memberInfo}
            {organizationModals.modals}

            <ScimSetupBannerAndModal />

            {organization && organization.UsedMembers > paginatedMemberThreshold && hasRemoteMembers ? (
                <MembersRemote app={app} />
            ) : (
                <MembersLocal app={app} />
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
