import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import {
    Modal,
    ContentModal,
    InnerModal,
    FooterModal,
    ResetButton,
    PrimaryButton,
    Row,
    Field,
    Label,
    Input,
    useApiWithoutResult,
    useNotifications,
    useEventManager,
    useOrganization
} from 'react-components';

import MemberStorageSelector from './MemberStorageSelector';
import MemberVPNSelector from './MemberVPNSelector';
import { updateName, updateQuota, updateVPN } from 'proton-shared/lib/api/members';

const EditMemberModal = ({ onClose, member }) => {
    const [organization] = useOrganization();
    const { call } = useEventManager();
    const [model, updateModel] = useState({ name: member.Name, storage: member.MaxSpace, vpn: member.MaxVPN });
    const { createNotification } = useNotifications();
    const { request: requestUpdateName } = useApiWithoutResult(updateName);
    const { request: requestUpdateQuota } = useApiWithoutResult(updateQuota);
    const { request: requestUpdateVPN } = useApiWithoutResult(updateVPN);
    const hasVPN = organization.MaxVPN;
    const handleChangeName = ({ target }) => updateModel({ ...model, name: target.value });
    const handleChangeStorage = (storage) => updateModel({ ...model, storage });
    const handleChangeVPN = (vpn) => updateModel({ ...model, vpn });
    const handleSubmit = async () => {
        await requestUpdateName(member.ID, model.name);
        await requestUpdateQuota(member.ID, model.storage);
        if (hasVPN) {
            await requestUpdateVPN(member.ID, model.vpn);
        }
        await call();
        onClose();
        createNotification({ text: c('Success').t`User updated` });
    };
    return (
        <Modal onClose={onClose} title={c('Title').t`Edit user`} type="small">
            <ContentModal onSubmit={handleSubmit} onReset={onClose}>
                <InnerModal>
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
                                organization={organization}
                                member={member}
                                onChange={handleChangeStorage}
                            />
                        </Field>
                    </Row>
                    {hasVPN ? (
                        <Row>
                            <Label>{c('Label').t`VPN connections`}</Label>
                            <Field>
                                <MemberVPNSelector
                                    organization={organization}
                                    member={member}
                                    onChange={handleChangeVPN}
                                />
                            </Field>
                        </Row>
                    ) : null}
                </InnerModal>
                <FooterModal>
                    <ResetButton>{c('Action').t`Cancel`}</ResetButton>
                    <PrimaryButton type="submit">{c('Action').t`Save`}</PrimaryButton>
                </FooterModal>
            </ContentModal>
        </Modal>
    );
};

EditMemberModal.propTypes = {
    onClose: PropTypes.func.isRequired,
    member: PropTypes.object.isRequired
};

export default EditMemberModal;
