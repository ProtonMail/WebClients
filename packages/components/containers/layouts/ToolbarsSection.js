import React from 'react';
import { c } from 'ttag';
import { updateMessageButtons } from 'proton-shared/lib/api/mailSettings';
import { MESSAGE_BUTTONS } from 'proton-shared/lib/constants';
import { Button, ButtonGroup, Row, Label, Field, Radio, Icon } from '../../components';
import { useEventManager, useMailSettings, useNotifications, useApiWithoutResult } from '../../hooks';

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
            text: c('Success').t`Buttons position saved`,
        });
    };

    return (
        <>
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
                            <ButtonGroup className="ml1 no-pointer-events">
                                <Button group icon title={c('Action').t`Read`}>
                                    <Icon name="read" />
                                </Button>
                                <Button group icon title={c('Action').t`Unread`}>
                                    <Icon name="unread" />
                                </Button>
                            </ButtonGroup>
                        </Radio>
                    </div>
                    <div>
                        <Radio
                            checked={MessageButtons === UNREAD_READ}
                            disabled={loading}
                            onChange={hanldeChange}
                            value={UNREAD_READ}
                        >
                            <ButtonGroup className="ml1 no-pointer-events">
                                <Button group icon title={c('Action').t`Unread`}>
                                    <Icon name="unread" />
                                </Button>
                                <Button group icon title={c('Action').t`Read`}>
                                    <Icon name="read" />
                                </Button>
                            </ButtonGroup>
                        </Radio>
                    </div>
                </Field>
            </Row>
        </>
    );
};

export default ToolbarsSection;
