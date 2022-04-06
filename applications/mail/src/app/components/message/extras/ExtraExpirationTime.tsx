import { c } from 'ttag';

import { classnames, Icon, Tooltip, ButtonLike, Button, AlertModal, useModalState, Href } from '@proton/components';
import { useExpiration } from '../../../hooks/useExpiration';
import { MessageState } from '../../../logic/messages/messagesTypes';

interface Props {
    message: MessageState;
    displayAsButton?: boolean;
    marginBottom?: boolean;
}

const ExtraExpirationTime = ({ message, displayAsButton = false, marginBottom = true }: Props) => {
    const [expirationModalProps, setExpirationModalOpen] = useModalState();
    const { onClose } = expirationModalProps;

    const { isExpiration, delayMessage, buttonMessage, expireOnMessage, lessThanTwoHours } = useExpiration(message);
    const isExpiringDraft = !!message.draftFlags?.expiresIn;

    if (!isExpiration) {
        return null;
    }

    if (displayAsButton) {
        return (
            <>
                <Tooltip title={delayMessage}>
                    <ButtonLike
                        as="span"
                        color={lessThanTwoHours ? 'danger' : undefined}
                        data-testid="expiration-banner"
                        className="inline-flex flex-align-items-center on-mobile-w100 on-mobile-flex-justify-center mr0-5 on-mobile-mr0 mb0-85 cursor-pointer px0-5"
                        onClick={() => setExpirationModalOpen(true)}
                    >
                        <Icon name="hourglass-empty" className="flex-item-noshrink ml0-2" />
                        <span className="ml0-5">{buttonMessage}</span>
                    </ButtonLike>
                </Tooltip>
                <AlertModal
                    title={c('Title').t`Message will expire`}
                    buttons={<Button type="submit" onClick={onClose}>{c('Action').t`Got it`}</Button>}
                    {...expirationModalProps}
                >
                    <div className="mr0-5">{expireOnMessage}</div>
                    <Href href={'https://protonmail.com/support/knowledge-base/expiration/'}>{c('Link')
                        .t`Learn more`}</Href>
                </AlertModal>
            </>
        );
    }

    return (
        <div
            className={classnames([
                'rounded p0-5 flex flex-nowrap',
                isExpiringDraft ? 'bg-primary' : 'bg-warning',
                marginBottom && 'mb0-85',
            ])}
            data-testid="expiration-banner"
        >
            <Icon name="hourglass-empty" className="flex-item-noshrink mtauto mbauto" />
            <span className="pl0-5 pr0-5 flex-item-fluid">{expireOnMessage}</span>
        </div>
    );
};

export default ExtraExpirationTime;
