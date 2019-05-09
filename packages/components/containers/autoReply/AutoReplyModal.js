import React from 'react';
import {
    Modal,
    ContentModal,
    FooterModal,
    Button,
    PrimaryButton,
    useMailSettings,
    useApiWithoutResult,
    useEventManager,
    useNotifications
} from 'react-components';
import { updateAutoresponder } from 'proton-shared/lib/api/mailSettings';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import AutoReplyForm from './AutoReplyForm/AutoReplyForm';
import useAutoReplyForm from './AutoReplyForm/useAutoReplyForm';

const AutoReplyModal = ({ onClose }) => {
    const [{ AutoResponder }] = useMailSettings();
    const { createNotification } = useNotifications();
    const { model, updateModel, toAutoResponder } = useAutoReplyForm(AutoResponder);
    const { request } = useApiWithoutResult(updateAutoresponder);
    const { call } = useEventManager();

    const handleSubmit = async () => {
        await request(toAutoResponder(model));
        onClose();
        await call();
        createNotification({ text: c('Success').t`Auto-reply updated` });
    };

    return (
        <Modal title={c('Title').t`Create auto-reply`} type="small" onClose={onClose}>
            <ContentModal>
                <AutoReplyForm model={model} updateModel={updateModel} />

                <FooterModal>
                    <Button onClick={onClose}>{c('Action').t`Cancel`}</Button>
                    <PrimaryButton onClick={handleSubmit}>{c('Action').t`Update`}</PrimaryButton>
                </FooterModal>
            </ContentModal>
        </Modal>
    );
};

AutoReplyModal.propTypes = {
    onClose: PropTypes.func.isRequired
};

export default AutoReplyModal;
