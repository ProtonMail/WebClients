import * as React from 'react';
import { c } from 'ttag';
import { useHistory } from 'react-router';

import { Button, Href, Icon, Loader } from '@proton/components';
import useNotifications from '@proton/components/hooks/useNotifications';

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
    const { createNotification } = useNotifications();

    const subject = message.data?.Subject;

    if (!messageLoaded) {
        return <Loader />;
    }

    const handleReply = () => {
        if (numberOfReplies < EO_MAX_REPLIES_NUMBER) {
            history.push(`${EO_REPLY_REDIRECT_PATH}/${id}`);
        } else {
            createNotification({
                type: 'info',
                text: (
                    <>
                        {c('info').t`ProtonMail's Encrypted Outside feature only allows replying 5 times.`}
                        <Href url="https://protonmail.com/signup" className="ml0-5">
                            {c('info')
                                .t`You can sign up for ProtonMail for seamless and unlimited end-to-end encryption`}
                        </Href>
                    </>
                ),
            });
        }
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
