import { c } from 'ttag';

import { Button } from '@proton/atoms';
import Prompt from '@proton/components/components/prompt/Prompt';
import Tooltip from '@proton/components/components/tooltip/Tooltip';
import { getInviteLimit } from '@proton/components/containers/members/UsersAndAddressesSection/helper';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { BRAND_NAME, PLAN_NAMES } from '@proton/shared/lib/constants';
import type { Domain, EnhancedMember, Organization } from '@proton/shared/lib/interfaces';
import { isOrganizationFamily } from '@proton/shared/lib/organization/helper';

import type { ModalStateProps } from '../../components';
import { useModalState } from '../../components';
import { useCustomDomains } from '../../hooks';
import SubUserCreateModal from './SubUserCreateModal';

interface Props extends ModalStateProps {
    members: EnhancedMember[] | undefined;
    organization?: Organization;
    verifiedDomains: Domain[];
    onInviteUser: () => void;
    allowAIAssistantConfiguration: boolean;
    aiSeatsRemaining: boolean;
    app: APP_NAMES;
}

interface ButtonProps {
    onClick: () => void;
}

const AddUserButton = ({ onClick }: ButtonProps) => {
    const [customDomains = []] = useCustomDomains();

    if (customDomains.length === 0) {
        return (
            <Tooltip
                title={c('familyOffer_2023:Family plan')
                    .t`You need to configure a custom domain before creating a new user.`}
            >
                <div className="w-full">
                    <Button disabled fullWidth>{c('familyOffer_2023:Action').t`Create a new user`}</Button>
                </div>
            </Tooltip>
        );
    }

    return <Button onClick={onClick} fullWidth>{c('familyOffer_2023:Action').t`Create a new user`}</Button>;
};

interface InviteButtonProps {
    organization?: Organization;
}

const InviteProtonUserButton = ({ onClick, organization }: ButtonProps & InviteButtonProps) => {
    if (organization && organization.InvitationsRemaining === 0) {
        const tooltip = isOrganizationFamily(organization) ? getInviteLimit(10) : getInviteLimit(3);

        return (
            <Tooltip title={tooltip}>
                <div className="w-full">
                    <Button disabled fullWidth>{c('familyOffer_2023:Action')
                        .t`Invite an existing ${BRAND_NAME} user`}</Button>
                </div>
            </Tooltip>
        );
    }

    return (
        <Button fullWidth onClick={onClick} color="norm">{c('familyOffer_2023:Action')
            .t`Invite an existing ${BRAND_NAME} user`}</Button>
    );
};

const InviteUserCreateSubUserModal = ({
    members,
    organization,
    verifiedDomains,
    onInviteUser,
    app,
    allowAIAssistantConfiguration,
    aiSeatsRemaining,
    ...modalState
}: Props) => {
    const [subUserCreateModalProps, setSubUserCreateModalOpen, renderSubUserCreateModal] = useModalState();

    const handleAddUser = () => {
        setSubUserCreateModalOpen(true);
    };

    const handleInviteUser = () => {
        modalState.onClose();
        onInviteUser();
    };

    return (
        <>
            <Prompt
                title={c('familyOffer_2023:Title').t`Add a user to your ${PLAN_NAMES.visionary2022} account`}
                buttons={[
                    <InviteProtonUserButton onClick={handleInviteUser} organization={organization} />,
                    <AddUserButton onClick={handleAddUser} />,
                    <Button fullWidth onClick={modalState.onClose} shape="ghost">{c('Action').t`Cancel`}</Button>,
                ]}
                {...modalState}
            >
                <p>{c('familyOffer_2023:Info').t`To create a new user, a configured custom domain is required.`}</p>
            </Prompt>
            {renderSubUserCreateModal && organization && verifiedDomains?.length > 0 && (
                <SubUserCreateModal
                    members={members}
                    aiSeatsRemaining={aiSeatsRemaining}
                    organization={organization}
                    verifiedDomains={verifiedDomains}
                    {...subUserCreateModalProps}
                    onClose={() => modalState.onClose()}
                    allowStorageConfiguration
                    allowVpnAccessConfiguration
                    allowPrivateMemberConfiguration
                    allowAIAssistantConfiguration={allowAIAssistantConfiguration}
                    app={app}
                />
            )}
        </>
    );
};

export default InviteUserCreateSubUserModal;
