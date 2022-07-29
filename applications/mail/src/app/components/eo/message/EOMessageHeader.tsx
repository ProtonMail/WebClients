import * as React from 'react';
import { useHistory } from 'react-router';

import { c } from 'ttag';

import { Button, Icon, Loader, Tooltip, classnames } from '@proton/components';

import { EO_MAX_REPLIES_NUMBER, EO_REPLY_REDIRECT_PATH } from '../../../constants';
import { MessageState } from '../../../logic/messages/messagesTypes';

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
        <Button
            onClick={handleReply}
            color="norm"
            className="mlauto flex flex-align-items-center"
            disabled={!canReply}
            data-testid="eoreply:button"
        >
            <Icon name="arrow-up-and-left" className="on-rtl-mirror mr0-5" alt={c('Title').t`Reply`} />
            <span>{c('Action').t`Reply securely`}</span>
        </Button>
    );

    return (
        <div
            className={classnames([
                'flex flex-align-items-center border-bottom px2 py1-5 on-tiny-mobile-pl0 on-tiny-mobile-pr0',
                !canReply && 'flex-justify-space-between',
            ])}
        >
            <h1 className="text-ellipsis m0 eo-layout-title" title={subject}>
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
