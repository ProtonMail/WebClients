import React from 'react';
import { FormModal, useMailSettings, useApiWithoutResult, useEventManager, useNotifications } from 'react-components';
import { updateAutoresponder } from 'proton-shared/lib/api/mailSettings';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import AutoReplyForm from './AutoReplyForm/AutoReplyForm';
import useAutoReplyForm from './AutoReplyForm/useAutoReplyForm';

const AutoReplyModal = ({ onClose, ...rest }) => {
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
        <FormModal
            title={c('Title').t`Create auto-reply`}
            onSubmit={handleSubmit}
            onClose={onClose}
            submit={c('Action').t`Update`}
            close={c('Action').t`Cancel`}
            {...rest}
        >
            <AutoReplyForm model={model} updateModel={updateModel} />
        </FormModal>
    );
};

AutoReplyModal.propTypes = {
    onClose: PropTypes.func
};

export default AutoReplyModal;
