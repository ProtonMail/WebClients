import { c } from 'ttag';

import { Button, ButtonLike } from '@proton/atoms';
import {
    AlertModal,
    Href,
    Icon,
    classnames,
    useApi,
    useEventManager,
    useModalState,
    useNotifications,
    useUser,
} from '@proton/components';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';

import { useExpiration } from '../../../hooks/useExpiration';
import { expireMessages } from '../../../logic/messages/expire/messagesExpireActions';
import { MessageState } from '../../../logic/messages/messagesTypes';
import { useAppDispatch } from '../../../logic/store';

interface Props {
    message: MessageState;
    displayAsButton?: boolean;
    marginBottom?: boolean;
    onEditExpiration?: () => void;
}

const ExtraExpirationTime = ({ message, displayAsButton = false, marginBottom = true, onEditExpiration }: Props) => {
    const dispatch = useAppDispatch();
    const { createNotification } = useNotifications();
    const api = useApi();
    const [user] = useUser();
    const { call } = useEventManager();
    const [expirationModalProps, setExpirationModalOpen] = useModalState();
    const { onClose } = expirationModalProps;
    const { isExpiration, delayMessage, expireOnMessage, lessThanTwoHours } = useExpiration(message);
    const isExpiringDraft = !!message.draftFlags?.expiresIn;

    if (!isExpiration) {
        return null;
    }

    if (displayAsButton) {
        const handleRemove = () => {
            void dispatch(expireMessages({ IDs: [message.localID], expirationTime: null, api, call }));
            onClose();
            createNotification({ text: c('Success').t`Expiration removed` });
        };
        return (
            <>
                <ButtonLike
                    as="span"
                    color={lessThanTwoHours ? 'danger' : undefined}
                    data-testid="expiration-banner"
                    className="inline-flex flex-align-items-center on-mobile-w100 on-mobile-flex-justify-center mr0-5 on-mobile-mr0 mb0-85 px0-5"
                    onClick={() => setExpirationModalOpen(true)}
                >
                    <Icon name="hourglass" className="flex-item-noshrink ml0-2" />
                    <span className="ml0-5">{delayMessage}</span>
                </ButtonLike>
                <AlertModal
                    title={c('Title').t`Message will expire`}
                    buttons={[
                        <Button autoFocus type="submit" onClick={onClose}>{c('Action').t`Got it`}</Button>,
                        <Button disabled={user.isFree} onClick={handleRemove}>{c('Action')
                            .t`Remove expiration`}</Button>,
                    ]}
                    {...expirationModalProps}
                >
                    <div className="mr0-5">{expireOnMessage}</div>
                    <Href href={getKnowledgeBaseUrl('/expiration')}>{c('Link').t`Learn more`}</Href>
                </AlertModal>
            </>
        );
    }

    return (
        <div
            className={classnames([
                'rounded border pl0-5 pr0-25 on-mobile-pr0-5 on-mobile-pb0-5 py0-25 flex flex-align-items-center flex-gap-0-5',
                isExpiringDraft ? 'bg-info border-info' : 'bg-warning border-warning',
                marginBottom && 'mb0-5',
            ])}
            data-testid="expiration-banner"
        >
            <Icon name="hourglass" className="flex-item-noshrink myauto" />
            <span className="flex-item-fluid">{expireOnMessage}</span>
            <span className="on-mobile-w100 flex-item-noshrink flex-align-items-start flex">
                <Button
                    size="small"
                    shape="outline"
                    color={isExpiringDraft ? 'info' : 'warning'}
                    fullWidth
                    className="rounded-sm"
                    onClick={onEditExpiration}
                    data-testid="message:expiration-banner-edit-button"
                >{c('Action').t`Edit`}</Button>
            </span>
        </div>
    );
};

export default ExtraExpirationTime;
