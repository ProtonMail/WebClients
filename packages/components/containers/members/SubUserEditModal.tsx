import { FormEvent, useMemo, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { adminTooltipText } from '@proton/components/containers/members/constants';
import { useLoading } from '@proton/hooks';
import { privatizeMember, updateName, updateQuota, updateRole, updateVPN } from '@proton/shared/lib/api/members';
import {
    GIGA,
    MEMBER_PRIVATE,
    MEMBER_ROLE,
    MEMBER_SUBSCRIBER,
    NAME_PLACEHOLDER,
    VPN_CONNECTIONS,
} from '@proton/shared/lib/constants';
import { requiredValidator } from '@proton/shared/lib/helpers/formValidators';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import { Member } from '@proton/shared/lib/interfaces';
import clsx from '@proton/utils/clsx';

import {
    Info,
    InputFieldTwo,
    ModalTwo as Modal,
    ModalTwoContent as ModalContent,
    ModalTwoFooter as ModalFooter,
    ModalTwoHeader as ModalHeader,
    ModalProps,
    Prompt,
    Toggle,
    useFormErrors,
    useModalState,
} from '../../components';
import { useApi, useEventManager, useNotifications, useOrganization } from '../../hooks';
import Addresses from '../addresses/Addresses';
import MemberStorageSelector, { getStorageRange, getTotalStorage } from './MemberStorageSelector';
import { UserManagementMode } from './types';

interface Props extends ModalProps<'form'> {
    member: Member;
    mode: UserManagementMode;
}

const SubUserEditModal = ({ member, mode, ...rest }: Props) => {
    const [organization] = useOrganization();
    const storageSizeUnit = GIGA;
    const { call } = useEventManager();
    const { validator, onFormSubmit } = useFormErrors();
    const [confirmDemotionModalProps, setConfirmDemotionModal, renderConfirmDemotion] = useModalState();

    const initialModel = useMemo(
        () => ({
            name: member.Name,
            storage: member.MaxSpace,
            vpn: !!member.MaxVPN,
            private: !!member.Private,
            admin: member.Role === MEMBER_ROLE.ORGANIZATION_ADMIN,
        }),
        [member]
    );

    const [model, updateModel] = useState(initialModel);

    const [submitting, withLoading] = useLoading();
    const { createNotification } = useNotifications();
    const api = useApi();

    const hasVPN = Boolean(organization?.MaxVPN);
    const canMakePrivate = member.Private === MEMBER_PRIVATE.READABLE;
    const canMakeAdmin = !member.Self && member.Role === MEMBER_ROLE.ORGANIZATION_MEMBER;
    const canRevokeAdmin = !member.Self && member.Role === MEMBER_ROLE.ORGANIZATION_ADMIN;

    const isVpnB2B = mode === UserManagementMode.VPN_B2B;
    const isDefault = mode === UserManagementMode.DEFAULT;

    const updatePartialModel = (partial: Partial<typeof model>) => {
        updateModel({ ...model, ...partial });
    };

    const handleSubmit = async ({ role }: { role: MEMBER_ROLE | null }) => {
        if (role === null && canRevokeAdmin && !model.admin && model.admin !== initialModel.admin) {
            setConfirmDemotionModal(true);
            return;
        }

        let hasChanges = false;
        if (initialModel.name !== model.name) {
            await api(updateName(member.ID, model.name));
            hasChanges = true;
        }

        if (initialModel.storage !== model.storage) {
            await api(updateQuota(member.ID, model.storage));
            hasChanges = true;
        }

        if (hasVPN && initialModel.vpn !== model.vpn) {
            await api(updateVPN(member.ID, model.vpn ? VPN_CONNECTIONS : 0));
            hasChanges = true;
        }

        if (canMakePrivate && model.private && model.private !== initialModel.private) {
            await api(privatizeMember(member.ID));
            hasChanges = true;
        }

        if (canMakeAdmin && model.admin && model.admin !== initialModel.admin) {
            await api(updateRole(member.ID, MEMBER_ROLE.ORGANIZATION_ADMIN));
            hasChanges = true;
        }

        if (role === MEMBER_ROLE.ORGANIZATION_MEMBER) {
            await api(updateRole(member.ID, MEMBER_ROLE.ORGANIZATION_MEMBER));
            hasChanges = true;
        }

        if (hasChanges) {
            await call();
            createNotification({ text: c('Success').t`User updated` });
        }
        rest.onClose?.();
    };

    const handleClose = submitting ? undefined : rest.onClose;

    return (
        <>
            {renderConfirmDemotion && (
                <Prompt
                    title={c('Title').t`Change role`}
                    buttons={[
                        <Button
                            color="danger"
                            loading={submitting}
                            onClick={() => {
                                confirmDemotionModalProps.onClose();
                                void withLoading(handleSubmit({ role: MEMBER_ROLE.ORGANIZATION_MEMBER }));
                            }}
                        >{c('Action').t`Remove`}</Button>,
                        <Button
                            onClick={() => {
                                confirmDemotionModalProps.onClose();
                            }}
                        >{c('Action').t`Cancel`}</Button>,
                    ]}
                    {...confirmDemotionModalProps}
                >
                    {member.Subscriber === MEMBER_SUBSCRIBER.PAYER
                        ? c('Info')
                              .t`This user is currently responsible for payments for your organization. By demoting this member, you will become responsible for payments for your organization.`
                        : c('Info').t`Are you sure you want to remove administrative privileges from this user?`}
                </Prompt>
            )}
            <Modal
                as="form"
                size="large"
                {...rest}
                onSubmit={(event: FormEvent) => {
                    event.preventDefault();
                    event.stopPropagation();
                    if (!onFormSubmit()) {
                        return;
                    }
                    void withLoading(handleSubmit({ role: null }));
                }}
                onClose={handleClose}
            >
                <ModalHeader title={c('Title').t`Edit user`} />
                <ModalContent>
                    <InputFieldTwo
                        id="name"
                        value={model.name}
                        error={validator([requiredValidator(model.name)])}
                        onValue={(value: string) => updatePartialModel({ name: value })}
                        label={c('Label').t`Name`}
                        placeholder={NAME_PLACEHOLDER}
                    />
                    {isDefault && (
                        <MemberStorageSelector
                            className="mb-5"
                            value={model.storage}
                            sizeUnit={storageSizeUnit}
                            totalStorage={getTotalStorage(member, organization)}
                            range={getStorageRange(member, organization)}
                            onChange={(storage) => updatePartialModel({ storage })}
                        />
                    )}

                    {hasVPN && isDefault ? (
                        <div className="flex mb-5">
                            <label className="text-semibold mr-4" htmlFor="vpn-toggle">
                                {c('Label for new member').t`VPN connections`}
                            </label>
                            <Toggle
                                id="vpn-toggle"
                                checked={model.vpn}
                                onChange={({ target }) => updatePartialModel({ vpn: target.checked })}
                            />
                        </div>
                    ) : null}

                    {canMakePrivate && isDefault && (
                        <div className="flex mb-6">
                            <label className="text-semibold mr-4" htmlFor="private-toggle">
                                {c('Label for new member').t`Private`}
                            </label>
                            <Toggle
                                id="private-toggle"
                                checked={model.private}
                                onChange={({ target }) => updatePartialModel({ private: target.checked })}
                            />
                        </div>
                    )}
                    {(canMakeAdmin || canRevokeAdmin) && (
                        <div className="flex items-center mb-6">
                            <label
                                className={clsx(['text-semibold', isVpnB2B ? 'mr-1' : 'mr-4'])}
                                htmlFor="admin-toggle"
                            >
                                {c('Label for new member').t`Admin`}
                            </label>
                            <Info className="mr-4" title={adminTooltipText} url={getKnowledgeBaseUrl('/user-roles')} />
                            <Toggle
                                id="admin-toggle"
                                checked={model.admin}
                                onChange={({ target }) => updatePartialModel({ admin: target.checked })}
                            />
                        </div>
                    )}
                    {isDefault && (
                        <div>
                            <h3 className="text-strong">{c('Label').t`Addresses`}</h3>
                            <div>
                                <Addresses organization={organization} memberID={member.ID} />
                            </div>
                        </div>
                    )}
                </ModalContent>
                <ModalFooter>
                    <Button
                        className={clsx([isVpnB2B && 'visibility-hidden'])}
                        onClick={handleClose}
                        disabled={submitting}
                    >
                        {c('Action').t`Cancel`}
                    </Button>
                    <Button loading={submitting} type="submit" color="norm">
                        {c('Action').t`Save`}
                    </Button>
                </ModalFooter>
            </Modal>
        </>
    );
};

export default SubUserEditModal;
