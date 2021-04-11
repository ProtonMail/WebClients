import React, { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { privatizeMember, updateName, updateQuota, updateRole, updateVPN } from 'proton-shared/lib/api/members';
import { GIGA, MEMBER_PRIVATE, MEMBER_ROLE, MEMBER_SUBSCRIBER } from 'proton-shared/lib/constants';
import { FormModal, Row, Field, Label, Input, Toggle, ConfirmModal, Alert } from '../../components';
import { useApi, useNotifications, useEventManager, useOrganization, useLoading, useModals } from '../../hooks';

import MemberStorageSelector, { getStorageRange } from './MemberStorageSelector';
import MemberVPNSelector, { getVPNRange } from './MemberVPNSelector';
import Addresses from '../addresses/Addresses';

const EditMemberModal = ({ onClose, member, ...rest }) => {
    const [organization] = useOrganization();
    const { call } = useEventManager();
    const { createModal } = useModals();

    const initialModel = useMemo(
        () => ({
            name: member.Name,
            storage: member.MaxSpace,
            vpn: member.MaxVPN,
            private: member.Private,
            admin: member.Role === MEMBER_ROLE.ORGANIZATION_OWNER,
        }),
        [member]
    );

    const [model, updateModel] = useState(initialModel);

    const [loading, withLoading] = useLoading();
    const { createNotification } = useNotifications();
    const api = useApi();

    const hasVPN = Boolean(organization.MaxVPN);
    const canMakePrivate = member.Private === MEMBER_PRIVATE.READABLE;
    const canMakeAdmin = !member.Self && member.Role === MEMBER_ROLE.ORGANIZATION_MEMBER;
    const canRevokeAdmin = !member.Self && member.Role === MEMBER_ROLE.ORGANIZATION_OWNER;

    const updatePartialModel = (partial) => {
        updateModel({ ...model, ...partial });
    };

    const handleChangeName = ({ target: { value } }) => updatePartialModel({ name: value });
    const handleChangeStorage = (storage) => updatePartialModel({ storage });
    const handleChangeVPN = (vpn) => updatePartialModel({ vpn });
    const handleChangePrivate = ({ target: { checked } }) => updatePartialModel({ private: checked });
    const handleChangeAdmin = ({ target: { checked } }) => updatePartialModel({ admin: checked });

    const handleSubmit = async () => {
        await api(updateName(member.ID, model.name));

        await api(updateQuota(member.ID, +model.storage));

        if (hasVPN) {
            await api(updateVPN(member.ID, +model.vpn));
        }

        if (canMakePrivate && model.private && model.private !== initialModel.Private) {
            await api(privatizeMember(member.ID));
        }

        if (canMakeAdmin && model.admin && model.admin !== initialModel.Admin) {
            await api(updateRole(member.ID, MEMBER_ROLE.ORGANIZATION_OWNER));
        }

        if (canRevokeAdmin && !model.admin && model.admin !== initialModel.Admin) {
            try {
                await new Promise((resolve, reject) => {
                    createModal(
                        <ConfirmModal
                            onClose={reject}
                            onConfirm={() => resolve(undefined)}
                            title={c('Title').t`Change role`}
                        >
                            <Alert>
                                {member.Subscriber === MEMBER_SUBSCRIBER.PAYER
                                    ? c('Info')
                                          .t`This user is currently responsible for payments for your organization. By demoting this member, you will become responsible for payments for your organization.`
                                    : c('Info')
                                          .t`Are you sure you want to remove administrative privileges from this user?`}
                            </Alert>
                        </ConfirmModal>
                    );
                });

                await api(updateRole(member.ID, MEMBER_ROLE.ORGANIZATION_MEMBER));
            } catch (e) {
                /* do nothing, user declined confirm-modal to revoke admin rights from member */
            }
        }

        await call();
        onClose();
        createNotification({ text: c('Success').t`User updated` });
    };

    const storageRange = getStorageRange(member, organization);
    const vpnRange = getVPNRange(member, organization);

    return (
        <FormModal
            onClose={onClose}
            onSubmit={() => withLoading(handleSubmit())}
            loading={loading}
            save={c('Action').t`Save`}
            title={c('Title').t`Edit user`}
            {...rest}
        >
            <Row>
                <Label htmlFor="nameInput">{c('Label').t`Name`}</Label>
                <Field>
                    <Input
                        value={model.name}
                        id="nameInput"
                        placeholder="Thomas A. Anderson"
                        onChange={handleChangeName}
                        required
                    />
                </Field>
            </Row>
            <Row>
                <Label>{c('Label').t`Account storage`}</Label>
                <Field>
                    <MemberStorageSelector
                        value={model.storage}
                        step={GIGA}
                        range={storageRange}
                        onChange={handleChangeStorage}
                    />
                </Field>
            </Row>
            {hasVPN && (
                <Row>
                    <Label>{c('Label').t`VPN connections`}</Label>
                    <Field>
                        <MemberVPNSelector value={model.vpn} step={1} range={vpnRange} onChange={handleChangeVPN} />
                    </Field>
                </Row>
            )}
            {canMakePrivate && (
                <Row>
                    <Label htmlFor="private-toggle">{c('Label').t`Private User`}</Label>
                    <Field>
                        <Toggle id="private-toggle" checked={model.private} onChange={handleChangePrivate} />
                    </Field>
                </Row>
            )}
            {(canMakeAdmin || canRevokeAdmin) && (
                <Row>
                    <Label htmlFor="admin-toggle">{c('Label').t`Admin rights`}</Label>
                    <Field>
                        <Toggle id="admin-toggle" checked={model.admin} onChange={handleChangeAdmin} />
                    </Field>
                </Row>
            )}
            <Row>
                <Label>{c('Label').t`Addresses`}</Label>
                <div>
                    <Addresses organization={organization} />
                </div>
            </Row>
        </FormModal>
    );
};

EditMemberModal.propTypes = {
    onClose: PropTypes.func,
    member: PropTypes.object.isRequired,
};

export default EditMemberModal;
