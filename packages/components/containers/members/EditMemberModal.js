import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import {
    FormModal,
    Row,
    Field,
    Label,
    Input,
    useApi,
    useNotifications,
    useEventManager,
    useOrganization,
    useLoading
} from 'react-components';
import { updateName, updateQuota, updateVPN } from 'proton-shared/lib/api/members';
import { GIGA } from 'proton-shared/lib/constants';

import MemberStorageSelector, { getStorageRange } from './MemberStorageSelector';
import MemberVPNSelector, { getVPNRange } from './MemberVPNSelector';

const EditMemberModal = ({ onClose, member, ...rest }) => {
    const [organization] = useOrganization();
    const { call } = useEventManager();
    const [model, updateModel] = useState({ name: member.Name, storage: member.MaxSpace, vpn: member.MaxVPN });
    const [loading, withLoading] = useLoading();
    const { createNotification } = useNotifications();
    const api = useApi();

    const hasVPN = organization.MaxVPN;

    const handleChangeName = ({ target }) => updateModel({ ...model, name: target.value });
    const handleChangeStorage = (storage) => updateModel({ ...model, storage });
    const handleChangeVPN = (vpn) => updateModel({ ...model, vpn });

    const handleSubmit = async () => {
        await api(updateName(member.ID, model.name));
        await api(updateQuota(member.ID, +model.storage));
        if (hasVPN) {
            await api(updateVPN(member.ID, +model.vpn));
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
            small
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
            {hasVPN ? (
                <Row>
                    <Label>{c('Label').t`VPN connections`}</Label>
                    <Field>
                        <MemberVPNSelector value={model.vpn} step={1} range={vpnRange} onChange={handleChangeVPN} />
                    </Field>
                </Row>
            ) : null}
        </FormModal>
    );
};

EditMemberModal.propTypes = {
    onClose: PropTypes.func,
    member: PropTypes.object.isRequired
};

export default EditMemberModal;
