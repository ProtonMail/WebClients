import React, { useRef } from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { updateAutoresponder } from 'proton-shared/lib/api/mailSettings';
import { AutoReplyDuration } from 'proton-shared/lib/constants';

import { FormModal, useEventManager, useNotifications, useApi, useLoading, SimpleSquireEditor } from '../../index';

import useAutoReplyForm from './AutoReplyForm/useAutoReplyForm';
import AutoReplyFormFixed from './AutoReplyForm/AutoReplyFormFixed';
import AutoReplyFormMonthly from './AutoReplyForm/AutoReplyFormMonthly';
import AutoReplyFormDaily from './AutoReplyForm/AutoReplyFormDaily';
import AutoReplyFormWeekly from './AutoReplyForm/AutoReplyFormWeekly';
import AutoReplyFormPermanent from './AutoReplyForm/AutoReplyFormPermanent';
import DurationField from './AutoReplyForm/fields/DurationField';

const AutoReplyModal = ({ onClose, autoresponder, ...rest }) => {
    const [loading, withLoading] = useLoading();
    const api = useApi();
    const { createNotification } = useNotifications();
    const { model, updateModel, toAutoResponder } = useAutoReplyForm(autoresponder);
    const { call } = useEventManager();
    const editorRef = useRef(null);

    const handleSubmit = async () => {
        await api(updateAutoresponder(toAutoResponder(model)));
        await call();
        onClose();
        createNotification({ text: c('Success').t`Auto-reply updated` });
    };

    const handleEditorReady = () => {
        if (editorRef.current) {
            editorRef.current.value = model.message;
        }
    };

    return (
        <FormModal
            title={c('Title').t`Create auto-reply`}
            loading={loading}
            onSubmit={() => withLoading(handleSubmit())}
            onClose={onClose}
            submit={c('Action').t`Update`}
            {...rest}
        >
            <DurationField value={model.duration} onChange={updateModel('duration')} />
            {
                {
                    [AutoReplyDuration.FIXED]: <AutoReplyFormFixed model={model} updateModel={updateModel} />,
                    [AutoReplyDuration.DAILY]: <AutoReplyFormDaily model={model} updateModel={updateModel} />,
                    [AutoReplyDuration.MONTHLY]: <AutoReplyFormMonthly model={model} updateModel={updateModel} />,
                    [AutoReplyDuration.WEEKLY]: <AutoReplyFormWeekly model={model} updateModel={updateModel} />,
                    [AutoReplyDuration.PERMANENT]: <AutoReplyFormPermanent model={model} updateModel={updateModel} />,
                }[model.duration]
            }
            <SimpleSquireEditor
                ref={editorRef}
                supportImages={false}
                onReady={handleEditorReady}
                onChange={updateModel('message')}
            />
        </FormModal>
    );
};

AutoReplyModal.propTypes = {
    onClose: PropTypes.func,
    autoresponder: PropTypes.object,
};

export default AutoReplyModal;
