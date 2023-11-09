import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { APP_NAMES, BRAND_NAME, PLAN_NAMES } from '@proton/shared/lib/constants';
import { CachedOrganizationKey, Domain, Organization } from '@proton/shared/lib/interfaces';

import { ModalStateProps, Prompt, SubUserCreateModal, Tooltip, useDomains, useModalState } from '../..';

interface Props extends ModalStateProps {
    organization: Organization;
    verifiedDomains: Domain[];
    organizationKey?: CachedOrganizationKey;
    onInviteUser: () => void;
    app: APP_NAMES;
}

interface ButtonProps {
    onClick: () => void;
}

const AddUserButton = ({ onClick }: ButtonProps) => {
    const [domains = []] = useDomains();

    if (domains.length === 0) {
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
    organization: Organization;
}

const InviteProtonUserButton = ({ onClick, organization }: ButtonProps & InviteButtonProps) => {
    if (organization && organization.InvitationsRemaining === 0) {
        return (
            <Tooltip
                title={c('familyOffer_2023:Family plan')
                    .t`You have reached the limit of 10 accepted invitations in 6 months. The button will become clickable when you can invite additional users.`}
            >
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
    organization,
    verifiedDomains,
    organizationKey,
    onInviteUser,
    app,
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
            {renderSubUserCreateModal && organizationKey && verifiedDomains?.length > 0 && (
                <SubUserCreateModal
                    organization={organization}
                    organizationKey={organizationKey}
                    verifiedDomains={verifiedDomains}
                    {...subUserCreateModalProps}
                    onClose={() => modalState.onClose()}
                    app={app}
                />
            )}
        </>
    );
};

export default InviteUserCreateSubUserModal;
