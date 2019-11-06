import React from 'react';
import {
    SubTitle,
    Row,
    Field,
    Label,
    useModals,
    useMailSettings,
    Alert,
    useLoading,
    useApi,
    useEventManager
} from 'react-components';
import { updateAutoresponder } from 'proton-shared/lib/api/mailSettings';

import { c } from 'ttag';
import AutoReplyModal from './AutoReplyModal';
import AutoReplyTemplate from './AutoReplyTemplate';
import Toggle from '../../components/toggle/Toggle';

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
            <div className="p1">
                <SubTitle>{c('Title').t`Auto-reply`}</SubTitle>
                <Alert className="mt1 mb1" learnMore="https://protonmail.com/support/knowledge-base/autoresponder/">
                    {c('Info')
                        .t`Automatic replies can respond automatically to incoming messages (such as when you are on vacation and can't respond).`}
                </Alert>

                <Row>
                    <Label htmlFor="autoReplyToggle" className="flex-item-centered-vert">{c('Label')
                        .t`Auto-reply`}</Label>
                    <Field>
                        <Toggle
                            id="autoReplyToggle"
                            loading={loading}
                            checked={AutoResponder.IsEnabled}
                            onChange={({ target: { checked } }) => withLoading(handleToggle(checked))}
                        />
                    </Field>
                </Row>

                {AutoResponder.IsEnabled && (
                    <AutoReplyTemplate autoresponder={AutoResponder} onEdit={handleOpenModal} />
                )}
            </div>
        </>
    );
};

export default AutoReplySection;
