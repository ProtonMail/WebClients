import { Button, Icon } from '@proton/components';
import * as React from 'react';
import { c } from 'ttag';
import { useHistory } from 'react-router';
import { MessageState } from '../../../logic/messages/messagesTypes';

interface Props {
    message: MessageState;
    messageLoaded: boolean;
    id: string;
}

const EOMessageHeader = ({ message, messageLoaded, id }: Props) => {
    const history = useHistory();

    const subject = message.data?.Subject;

    if (!messageLoaded) {
        return <>Loading</>;
    }

    const handleReply = () => {
        history.push(`/eo/reply/${id}`);
    };

    return (
        <>
            <h1 className="text-ellipsis m0" title={subject}>
                {subject}
            </h1>
            <Button onClick={handleReply} color="norm" className="mlauto flex flex-align-items-center">
                <Icon name="arrow-up-and-left-big" className="on-rtl-mirror mr0-5" alt={c('Title').t`Reply`} />
                <span>{c('Action').t`Reply securely`}</span>
            </Button>
        </>
    );
};

export default EOMessageHeader;
