import * as React from 'react';
import { c } from 'ttag';
import { useHistory } from 'react-router';

import { Button, classnames, Icon, Loader, Tooltip } from '@proton/components';

import { MessageState } from '../../../logic/messages/messagesTypes';
import { EO_MAX_REPLIES_NUMBER, EO_REPLY_REDIRECT_PATH } from '../../../constants';

interface Props {
    message: MessageState;
    messageLoaded: boolean;
    id: string;
    numberOfReplies: number;
}

const EOMessageHeader = ({ message, messageLoaded, id, numberOfReplies }: Props) => {
    const history = useHistory();

    const subject = message.data?.Subject;

    const canReply = numberOfReplies < EO_MAX_REPLIES_NUMBER;

    if (!messageLoaded) {
        return <Loader />;
    }

    const handleReply = () => {
        history.push(`${EO_REPLY_REDIRECT_PATH}/${id}`);
    };

    const replyButton = (
        <Button onClick={handleReply} color="norm" className="mlauto flex flex-align-items-center" disabled={!canReply}>
            <Icon name="arrow-up-and-left-big" className="on-rtl-mirror mr0-5" alt={c('Title').t`Reply`} />
            <span>{c('Action').t`Reply securely`}</span>
        </Button>
    );

    return (
        <div
            className={classnames([
                'flex flex-align-items-center border-bottom p1',
                !canReply && 'flex-justify-space-between',
            ])}
        >
            <h1 className="text-ellipsis m0" title={subject}>
                {subject}
            </h1>
            {canReply ? (
                replyButton
            ) : (
                <Tooltip title={c('Info').t`You have reached the maximum number of 5 replies.`}>
                    <span>{replyButton}</span>
                </Tooltip>
            )}
        </div>
    );
};

export default EOMessageHeader;
