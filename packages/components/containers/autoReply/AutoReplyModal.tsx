import React, { useRef } from 'react';
import { c } from 'ttag';

import { AutoResponder } from '@proton/shared/lib/interfaces';
import { updateAutoresponder } from '@proton/shared/lib/api/mailSettings';
import { noop } from '@proton/shared/lib/helpers/function';
import { AutoReplyDuration } from '@proton/shared/lib/constants';

import { useEventManager, useNotifications, useApi, useLoading } from '../../hooks';
import { FormModal, SimpleSquireEditor } from '../../components';

import useAutoReplyForm from './AutoReplyForm/useAutoReplyForm';
import AutoReplyFormFixed from './AutoReplyForm/AutoReplyFormFixed';
import AutoReplyFormMonthly from './AutoReplyForm/AutoReplyFormMonthly';
import AutoReplyFormDaily from './AutoReplyForm/AutoReplyFormDaily';
import AutoReplyFormWeekly from './AutoReplyForm/AutoReplyFormWeekly';
import AutoReplyFormPermanent from './AutoReplyForm/AutoReplyFormPermanent';
import DurationField from './AutoReplyForm/fields/DurationField';
import { SquireEditorRef } from '../../components/editor/SquireEditor';

interface Props {
    autoresponder: AutoResponder;
    onClose?: () => void;
}

const AutoReplyModal = ({ onClose = noop, autoresponder, ...rest }: Props) => {
    const [loading, withLoading] = useLoading();
    const api = useApi();
    const { createNotification } = useNotifications();
    const { model, updateModel, toAutoResponder } = useAutoReplyForm(autoresponder);
    const { call } = useEventManager();
    const editorRef = useRef<SquireEditorRef>(null);

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

    const formRenderer = (duration: AutoReplyDuration) => {
        switch (duration) {
            case AutoReplyDuration.FIXED:
                return <AutoReplyFormFixed model={model} updateModel={updateModel} />;
            case AutoReplyDuration.DAILY:
                return <AutoReplyFormDaily model={model} updateModel={updateModel} />;
            case AutoReplyDuration.MONTHLY:
                return <AutoReplyFormMonthly model={model} updateModel={updateModel} />;
            case AutoReplyDuration.WEEKLY:
                return <AutoReplyFormWeekly model={model} updateModel={updateModel} />;
            case AutoReplyDuration.PERMANENT:
                return <AutoReplyFormPermanent />;

            default:
                return null;
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
            {formRenderer(model.duration)}
            <SimpleSquireEditor
                ref={editorRef}
                supportImages={false}
                onReady={handleEditorReady}
                onChange={updateModel('message')}
            />
        </FormModal>
    );
};

export default AutoReplyModal;
