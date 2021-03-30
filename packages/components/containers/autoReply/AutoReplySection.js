import React from 'react';
import { updateAutoresponder } from 'proton-shared/lib/api/mailSettings';
import { c } from 'ttag';

import { useModals, useMailSettings, useLoading, useApi, useEventManager } from '../../hooks';
import { Toggle, Button, Field, Label, Alert, EditableSection } from '../../components';
import AutoReplyModal from './AutoReplyModal';
import AutoReplyTemplate from './AutoReplyTemplate';

const AutoReplySection = () => {
    const { createModal } = useModals();
    const [{ AutoResponder }] = useMailSettings();
    const api = useApi();
    const { call } = useEventManager();
    const [loading, withLoading] = useLoading();

    const handleOpenModal = () => {
        createModal(<AutoReplyModal autoresponder={AutoResponder} />);
    };

    const handleToggle = async (isEnabled) => {
        if (isEnabled) {
            return handleOpenModal();
        }
        await api(updateAutoresponder({ ...AutoResponder, IsEnabled: false }));
        await call();
    };

    return (
        <>
            <Alert className="mt1 mb1" learnMore="https://protonmail.com/support/knowledge-base/autoresponder/">
                {c('Info')
                    .t`Automatic replies can respond automatically to incoming messages (such as when you are on vacation and can't respond).`}
            </Alert>

            <EditableSection className="editable-section-container--size-tablet">
                <Label htmlFor="autoReplyToggle" className="border-bottom on-mobile-pb0 on-mobile-no-border">{c('Label')
                    .t`Auto-reply`}</Label>
                <Field className="wauto border-bottom pt0-5 on-mobile-pb0 on-mobile-no-border flex flex-nowrap">
                    <span className="flex-item-noshrink">
                        <Toggle
                            id="autoReplyToggle"
                            loading={loading}
                            checked={AutoResponder.IsEnabled}
                            onChange={({ target: { checked } }) => withLoading(handleToggle(checked))}
                        />
                    </span>
                    {AutoResponder.IsEnabled && (
                        <span className="on-mobile-pb0 on-mobile-no-border mlauto pl2">
                            <Button color="norm" className="mt0-25" onClick={handleOpenModal}>{c('Action')
                                .t`Edit`}</Button>
                        </span>
                    )}
                </Field>
                {AutoResponder.IsEnabled && (
                    <AutoReplyTemplate autoresponder={AutoResponder} onEdit={handleOpenModal} />
                )}
            </EditableSection>
        </>
    );
};

export default AutoReplySection;
