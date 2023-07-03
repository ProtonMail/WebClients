import {
    differenceInHours,
    differenceInMinutes,
    endOfHour,
    endOfMinute,
    formatDistanceToNow,
    startOfHour,
    startOfMinute,
} from 'date-fns';
import { c, msgid } from 'ttag';

import { Button, ButtonLike, Href } from '@proton/atoms';
import { Icon, Prompt, Tooltip, useModalState } from '@proton/components';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';

import { getMessageExpirationDate } from '../../../helpers/message/messageExpirationTime';
import useExpiration from '../../../hooks/useExpiration';
import { MessageState } from '../../../logic/messages/messagesTypes';

interface Props {
    message: MessageState;
}

const getButtonText = (expirationDate: Date, messageExpiresSoon: boolean) => {
    if (messageExpiresSoon) {
        const hoursDiff = differenceInHours(endOfHour(expirationDate), startOfHour(new Date()));

        if (hoursDiff === 0) {
            const minutesDiff = differenceInMinutes(endOfMinute(expirationDate), startOfMinute(new Date()));

            // translator: When message expires in less than one hour we display "Expires in 10 minutes"
            return c('Info').ngettext(
                msgid`Expires in ${minutesDiff} minute`,
                `Expires in ${minutesDiff} minutes`,
                minutesDiff
            );
        }

        // translator: When message expires in more than one hour we display "Expires in less than X hours"
        return c('Info').ngettext(
            msgid`Expires in less than ${hoursDiff} hour`,
            `Expires in less than ${hoursDiff} hours`,
            hoursDiff
        );
    }

    const formattedDate = formatDistanceToNow(expirationDate);
    return c('Info').t`Expires in ${formattedDate}`;
};

const EOExpirationTime = ({ message }: Props) => {
    const [expirationModalProps, setExpirationModalOpen] = useModalState();
    const { onClose } = expirationModalProps;
    const { expirationMessage, expiresInLessThan24Hours } = useExpiration(message);

    const expirationDate = getMessageExpirationDate(message);

    if (!expirationDate) {
        return null;
    }

    const buttonMessage = getButtonText(expirationDate, expiresInLessThan24Hours);

    return (
        <>
            <Tooltip title={expirationMessage}>
                <ButtonLike
                    as="span"
                    color={expiresInLessThan24Hours ? 'danger' : undefined}
                    data-testid="expiration-banner"
                    className="inline-flex flex-align-items-center on-mobile-w100 on-mobile-flex-justify-center mb-3 px-2"
                    onClick={() => setExpirationModalOpen(true)}
                >
                    <Icon name="hourglass" className="flex-item-noshrink ml-1" />
                    <span className="ml-2">{buttonMessage}</span>
                </ButtonLike>
            </Tooltip>
            <Prompt
                title={c('Title').t`Message will expire`}
                buttons={[<Button autoFocus type="submit" onClick={onClose}>{c('Action').t`Got it`}</Button>]}
                {...expirationModalProps}
            >
                <div className="mr-2">{expirationMessage}</div>
                <Href href={getKnowledgeBaseUrl('/expiration')}>{c('Link').t`Learn more`}</Href>
            </Prompt>
        </>
    );
};

export default EOExpirationTime;
