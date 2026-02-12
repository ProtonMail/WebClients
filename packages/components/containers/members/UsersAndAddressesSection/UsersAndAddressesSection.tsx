import type { MutableRefObject } from 'react';

import { useOrganization } from '@proton/account/organization/hooks';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import SettingsParagraph from '@proton/components/containers/account/SettingsParagraph';
import SettingsSectionWide from '@proton/components/containers/account/SettingsSectionWide';
import DomainModal from '@proton/components/containers/domains/DomainModal';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import useFlag from '@proton/unleash/useFlag';

import useOrganizationModals from '../../organization/useOrganizationModals';
import useOrganizationUnprivatizationModals from '../../organization/useOrganizationUnprivatizationModals';
import { MembersLocal } from './MembersLocal';
import { MembersRemote } from './MembersRemote';
import UserAndAddressesSectionIntro from './UserAndAddressesSectionIntro';

const paginatedMemberThreshold = 250;

const UsersAndAddressesSection = ({ app, onceRef }: { app: APP_NAMES; onceRef: MutableRefObject<boolean> }) => {
    const organizationModals = useOrganizationModals(onceRef);
    const organizationUnprivatizationModals = useOrganizationUnprivatizationModals();
    const [organization] = useOrganization();
    const hasRemoteMembers = useFlag('MembersRemote');
    const [newDomainModalProps, setNewDomainModalOpen, renderNewDomain] = useModalState();

    return (
        <SettingsSectionWide>
            {organizationModals.info}
            {organizationUnprivatizationModals.memberInfo}
            {organizationModals.modals}

            <SettingsParagraph large className="flex items-center mb-6 gap-2">
                <UserAndAddressesSectionIntro onOpenNewDomainModal={setNewDomainModalOpen} />
            </SettingsParagraph>

            {organization && organization.UsedMembers > paginatedMemberThreshold && hasRemoteMembers ? (
                <MembersRemote app={app} />
            ) : (
                <MembersLocal app={app} />
            )}
            {renderNewDomain && <DomainModal {...newDomainModalProps} />}
        </SettingsSectionWide>
    );
};

export default UsersAndAddressesSection;
