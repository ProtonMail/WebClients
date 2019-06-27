import React from 'react';
import {
    SubTitle,
    Group,
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
import { MESSAGE_BUTTONS } from 'proton-shared/lib/constants';
import IconButton from '../../components/button/IconButton';

const { READ_UNREAD, UNREAD_READ } = MESSAGE_BUTTONS;

const ToolbarsSection = () => {
    const { request, loading } = useApiWithoutResult(updateMessageButtons);
    const [{ MessageButtons } = {}] = useMailSettings();
    const { createNotification } = useNotifications();
    const { call } = useEventManager();

    const hanldeChange = async ({ target }) => {
        const newState = target.value;
        await request(newState);
        await call();
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
                    <div className="mb1">
                        <Radio
                            checked={MessageButtons === READ_UNREAD}
                            disabled={loading}
                            onChange={hanldeChange}
                            value={READ_UNREAD}
                        >
                            <Group className="ml1 no-pointer-events">
                                <IconButton icon="read" className="pm-button-group" title={c('Action').t`Read`} />
                                <IconButton icon="unread" className="pm-button-group" title={c('Action').t`Unread`} />
                            </Group>
                        </Radio>
                    </div>
                    <div>
                        <Radio
                            checked={MessageButtons === UNREAD_READ}
                            disabled={loading}
                            onChange={hanldeChange}
                            value={UNREAD_READ}
                        >
                            <Group className="ml1 no-pointer-events">
                                <IconButton icon="unread" className="pm-button-group" title={c('Action').t`Unread`} />
                                <IconButton icon="read" className="pm-button-group" title={c('Action').t`Read`} />
                            </Group>
                        </Radio>
                    </div>
                </Field>
            </Row>
        </>
    );
};

export default ToolbarsSection;
