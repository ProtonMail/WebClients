import { c } from 'ttag';

import { Button, ButtonLike } from '@proton/atoms/Button';
import { Href, Icon, Tooltip, useModalState, Prompt } from '@proton/components/components';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';

import { useExpiration } from '../../../hooks/useExpiration';
import { MessageState } from '../../../logic/messages/messagesTypes';

interface Props {
    message: MessageState;
}

const EOExpirationTime = ({ message }: Props) => {
    const [expirationModalProps, setExpirationModalOpen] = useModalState();
    const { onClose } = expirationModalProps;
    const { isExpiration, delayMessage, buttonMessage, expireOnMessage, lessThanTwoHours } = useExpiration(message);

    if (!isExpiration) {
        return null;
    }

    return (
        <>
            <Tooltip title={delayMessage}>
                <ButtonLike
                    as="span"
                    color={lessThanTwoHours ? 'danger' : undefined}
                    data-testid="expiration-banner"
                    className="inline-flex flex-align-items-center on-mobile-w100 on-mobile-flex-justify-center mr0-5 on-mobile-mr0 mb0-85 px0-5"
                    onClick={() => setExpirationModalOpen(true)}
                >
                    <Icon name="hourglass" className="flex-item-noshrink ml0-2" />
                    <span className="ml0-5">{buttonMessage}</span>
                </ButtonLike>
            </Tooltip>
            <Prompt
                title={c('Title').t`Message will expire`}
                buttons={[<Button autoFocus type="submit" onClick={onClose}>{c('Action').t`Got it`}</Button>]}
                {...expirationModalProps}
            >
                <div className="mr0-5">{expireOnMessage}</div>
                <Href href={getKnowledgeBaseUrl('/expiration')}>{c('Link').t`Learn more`}</Href>
            </Prompt>
        </>
    );
};

export default EOExpirationTime;
