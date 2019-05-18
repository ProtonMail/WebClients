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
    useOrganization
} from 'react-components';

import MemberStorageSelector from './MemberStorageSelector';
import MemberVPNSelector from './MemberVPNSelector';
import { updateName, updateQuota, updateVPN } from 'proton-shared/lib/api/members';

const EditMemberModal = ({ onClose, member, ...rest }) => {
    const [organization] = useOrganization();
    const { call } = useEventManager();
    const [model, updateModel] = useState({ name: member.Name, storage: member.MaxSpace, vpn: member.MaxVPN });
    const [loading, setLoading] = useState(false);
    const { createNotification } = useNotifications();
    const api = useApi();

    const hasVPN = organization.MaxVPN;

    const handleChangeName = ({ target }) => updateModel({ ...model, name: target.value });
    const handleChangeStorage = (storage) => updateModel({ ...model, storage });
    const handleChangeVPN = (vpn) => updateModel({ ...model, vpn });

    const handleSubmit = async () => {
        try {
            setLoading(true);
            await api(updateName(member.ID, model.name));
            await api(updateQuota(member.ID, model.storage));
            if (hasVPN) {
                await api(updateVPN(member.ID, model.vpn));
            }
            await call();
            onClose();
            createNotification({ text: c('Success').t`User updated` });
        } catch (e) {
            setLoading(false);
        }
    };

    return (
        <FormModal
            onClose={onClose}
            onSubmit={handleSubmit}
            loading={loading}
            close={c('Action').t`Cancel`}
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
                    <MemberStorageSelector organization={organization} member={member} onChange={handleChangeStorage} />
                </Field>
            </Row>
            {hasVPN ? (
                <Row>
                    <Label>{c('Label').t`VPN connections`}</Label>
                    <Field>
                        <MemberVPNSelector organization={organization} member={member} onChange={handleChangeVPN} />
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
