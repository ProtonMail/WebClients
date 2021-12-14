import { Button, Icon } from '@proton/components';
import * as React from 'react';
import { c } from 'ttag';
import { MessageState } from 'proton-mail/src/app/logic/messages/messagesTypes';

interface Props {
    message: MessageState;
    messageLoaded: boolean;
}

const EOMessageHeader = ({ message, messageLoaded }: Props) => {
    const subject = message.data?.Subject;

    if (!messageLoaded) {
        return <>Loading</>;
    }

    return (
        <>
            <h1 className="text-ellipsis m0" title={subject}>
                {subject}
            </h1>
            <Button onClick={() => console.log('REPLY')} color="norm" className="mlauto flex flex-align-items-center">
                <Icon name="arrow-up-and-left-big" className="on-rtl-mirror mr0-5" alt={c('Title').t`Reply`} />
                <span>{c('Action').t`Reply securely`}</span>
            </Button>
        </>
    );
};

export default EOMessageHeader;
