import { useHistory } from 'react-router';

import { c } from 'ttag';

import { Button, Tooltip } from '@proton/atoms';
import { Icon, Loader } from '@proton/components';
import type { MessageState } from '@proton/mail/store/messages/messagesTypes';
import clsx from '@proton/utils/clsx';

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
        <Button
            onClick={handleReply}
            color="norm"
            className="ml-auto flex items-center"
            disabled={!canReply}
            data-testid="eoreply:button"
        >
            <Icon name="arrow-up-and-left-big" className="rtl:mirror mr-2" alt={c('Title').t`Reply`} />
            <span>{c('Action').t`Reply securely`}</span>
        </Button>
    );

    return (
        <div className={clsx(['flex items-center border-bottom px-7 py-5', !canReply && 'justify-space-between'])}>
            <h1 className="text-ellipsis m-0 mb-2 eo-layout-title" title={subject} data-testid="eo:subject">
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
