import React, { useState } from 'react';
import {
    SubTitle,
    Row,
    Label,
    Field,
    Radio,
    useEventManager,
    useMailSettings,
    useNotifications,
    useApiWithoutResult
} from 'react-components';
import { c } from 'ttag';
import { updateMessageButtons } from 'proton-shared/lib/api/mailSettings';

const ToolbarsSection = () => {
    const { request, loading } = useApiWithoutResult(updateMessageButtons);
    const [{ MessageButtons } = {}] = useMailSettings();
    const { createNotification } = useNotifications();
    const [state, setState] = useState(MessageButtons);
    const { call } = useEventManager();

    const hanldeChange = async ({ target }) => {
        const newState = target.value;
        await request(newState);
        await call();
        setState(newState);
        createNotification({
            text: c('Success').t`Buttons position saved`
        });
    };

    return (
        <>
            <SubTitle>{c('Title').t`Toolbars`}</SubTitle>
            <Row>
                <Label>{c('Label').t`Read/unread order`}</Label>
                <Field>
                    <Radio checked={state === 0} disabled={loading} onChange={hanldeChange} value={0}>{c('Label')
                        .t`Read -> Unread`}</Radio>
                    <Radio checked={state === 1} disabled={loading} onChange={hanldeChange} value={1}>{c('Label')
                        .t`Unread -> Read`}</Radio>
                </Field>
            </Row>
        </>
    );
};

export default ToolbarsSection;
