import { MouseEvent } from 'react';

import { c } from 'ttag';

import {
    Button,
    ButtonGroup,
    Icon,
    Tooltip,
    classnames,
    useAddresses,
    useContactModals,
    useMailSettings,
    useToggle,
} from '@proton/components';
import { shiftKey } from '@proton/shared/lib/helpers/browser';
import { scrollIntoView } from '@proton/shared/lib/helpers/dom';
import { MailSettings } from '@proton/shared/lib/interfaces';
import { Label } from '@proton/shared/lib/interfaces/Label';
import { VERIFICATION_STATUS } from '@proton/shared/lib/mail/constants';
import {
    getHasOnlyIcsAttachments,
    getRecipients,
    isInternal,
    isOutbox,
    isScheduled,
} from '@proton/shared/lib/mail/messages';

import { MESSAGE_ACTIONS } from '../../../constants';
import { useOnCompose, useOnMailTo } from '../../../containers/ComposeProvider';
import { isSelfAddress } from '../../../helpers/addresses';
import { MessageViewIcons } from '../../../helpers/message/icon';
import { useRecipientLabel } from '../../../hooks/contact/useRecipientLabel';
import { MessageState } from '../../../logic/messages/messagesTypes';
import { Breakpoints } from '../../../models/utils';
import ItemAttachmentIcon from '../../list/ItemAttachmentIcon';
import ItemDate from '../../list/ItemDate';
import ItemLabels from '../../list/ItemLabels';
import ItemLocation from '../../list/ItemLocation';
import ItemStar from '../../list/ItemStar';
import MailRecipients from '../recipients/MailRecipients';
import RecipientItem from '../recipients/RecipientItem';
import RecipientType from '../recipients/RecipientType';
import HeaderExtra from './HeaderExtra';
import HeaderMoreDropdown from './HeaderMoreDropdown';
import HeaderTopPrivacyIcon from './HeaderTopPrivacyIcon';

interface Props {
    labelID: string;
    labels?: Label[];
    mailSettings: MailSettings;
    message: MessageState;
    messageViewIcons: MessageViewIcons;
    isSentMessage: boolean;
    messageLoaded: boolean;
    bodyLoaded: boolean;
    sourceMode: boolean;
    onResignContact: () => void;
    onLoadRemoteImages: () => void;
    onLoadEmbeddedImages: () => void;
    onToggle: () => void;
    onBack: () => void;
    onSourceMode: (sourceMode: boolean) => void;
    breakpoints: Breakpoints;
    labelDropdownToggleRef: React.MutableRefObject<() => void>;
    moveDropdownToggleRef: React.MutableRefObject<() => void>;
    filterDropdownToggleRef: React.MutableRefObject<() => void>;
    parentMessageRef: React.RefObject<HTMLElement>;
}

const HeaderExpanded = ({
    labelID,
    labels,
    message,
    messageViewIcons,
    isSentMessage,
    messageLoaded,
    bodyLoaded,
    sourceMode,
    onResignContact,
    onLoadRemoteImages,
    onLoadEmbeddedImages,
    mailSettings,
    onToggle,
    onBack,
    onSourceMode,
    breakpoints,
    labelDropdownToggleRef,
    moveDropdownToggleRef,
    filterDropdownToggleRef,
    parentMessageRef,
}: Props) => {
    const [addresses = []] = useAddresses();
    const { state: showDetails, toggle: toggleDetails } = useToggle();
    const isSendingMessage = message.draftFlags?.sending;
    const isOutboxMessage = isOutbox(message.data);
    const hasOnlyIcsAttachments = getHasOnlyIcsAttachments(message.data?.AttachmentInfo);

    const isScheduledMessage = isScheduled(message.data);

    const [{ Shortcuts } = { Shortcuts: 0 }] = useMailSettings();

    const onCompose = useOnCompose();

    const onMailTo = useOnMailTo();

    const { modals, onDetails: onContactDetails, onEdit: onContactEdit } = useContactModals({ onMailTo });

    const { getRecipientsOrGroups } = useRecipientLabel();
    const recipients = getRecipients(message.data);
    const recipientsOrGroup = getRecipientsOrGroups(recipients);

    const handleClick = (event: MouseEvent) => {
        if (
            (event.target as HTMLElement).closest('.stop-propagation') ||
            window.getSelection()?.toString().length ||
            document.querySelector('.dropdown')
        ) {
            event.stopPropagation();
            return;
        }
        onToggle();
    };

    const handleAttachmentIconClick = (e: MouseEvent) => {
        e.stopPropagation();
        scrollIntoView(parentMessageRef.current, { block: 'end' });
    };

    const handleCompose = (action: MESSAGE_ACTIONS) => async () => {
        onCompose({
            action,
            referenceMessage: message,
        });
    };

    const hasSigningPublicKey =
        isInternal(message.data) &&
        !isSelfAddress(message.data?.Sender.Address, addresses) &&
        message.verification?.signingPublicKey &&
        message.verification?.verificationStatus !== VERIFICATION_STATUS.SIGNED_AND_VALID;

    const hasAttachedPublicKey =
        !isSelfAddress(message.data?.Sender?.Address, addresses) &&
        message.verification?.attachedPublicKeys &&
        message.verification?.verificationStatus !== VERIFICATION_STATUS.SIGNED_AND_VALID;

    const showPinPublicKey = hasSigningPublicKey || hasAttachedPublicKey;

    const { isNarrow } = breakpoints;

    const from = (
        <RecipientItem
            message={message}
            recipientOrGroup={{ recipient: message.data?.Sender }}
            isLoading={!messageLoaded}
            signingPublicKey={showPinPublicKey ? message.verification?.signingPublicKey : undefined}
            attachedPublicKey={showPinPublicKey ? message.verification?.attachedPublicKeys?.[0] : undefined}
            isNarrow={isNarrow}
            globalIcon={messageViewIcons.globalIcon}
            onContactDetails={onContactDetails}
            onContactEdit={onContactEdit}
        />
    );

    const titleReply = Shortcuts ? (
        <>
            {c('Title').t`Reply`}
            <br />
            <kbd className="border-none">R</kbd>
        </>
    ) : (
        c('Title').t`Reply`
    );
    const titleReplyAll = Shortcuts ? (
        <>
            {c('Title').t`Reply all`}
            <br />
            <kbd className="border-none">{shiftKey}</kbd> + <kbd className="border-none">R</kbd>
        </>
    ) : (
        c('Title').t`Reply all`
    );
    const titleForward = Shortcuts ? (
        <>
            {c('Title').t`Forward`}
            <br />
            <kbd className="border-none">{shiftKey}</kbd> + <kbd className="border-none">F</kbd>
        </>
    ) : (
        c('Title').t`Forward`
    );

    return (
        <div
            className={classnames([
                'message-header px1-25 message-header-expanded',
                isSentMessage ? 'is-outbound' : 'is-inbound',
                !messageLoaded && 'is-loading',
                showDetails ? 'message-header-expanded--with-details' : 'message-header-expanded--without-details',
            ])}
            data-testid={`message-header-expanded:${message.data?.Subject}`}
        >
            <HeaderTopPrivacyIcon message={message} />
            {isNarrow && messageLoaded && (
                <div className="flex flex-align-items-center flex-justify-space-between my0-5" onClick={handleClick}>
                    <span className="inline-flex">
                        <ItemLocation element={message.data} labelID={labelID} />
                        <ItemAttachmentIcon
                            icon={hasOnlyIcsAttachments ? 'calendar-grid' : undefined}
                            onClick={handleAttachmentIconClick}
                            element={message.data}
                            className="mr0-5"
                        />
                    </span>
                    <ItemDate element={message.data} labelID={labelID} useTooltip className="color-weak text-sm" />
                    <span className="message-header-star mr0-5 inline-flex">
                        <ItemStar element={message.data} />
                    </span>
                </div>
            )}
            <div
                className="flex flex-nowrap flex-align-items-center message-header-from-container"
                onClick={handleClick}
            >
                <span className="flex flex-item-fluid flex-nowrap mr0-5">
                    <div className={classnames(['flex flex-nowrap', !messageLoaded && 'flex-item-fluid'])}>
                        {isNarrow ? (
                            <span className="message-header-recipient-mobile">{from}</span>
                        ) : (
                            <RecipientType label={c('Label Recipient').t`From`}>{from}</RecipientType>
                        )}
                        {messageLoaded && (isOutboxMessage || isSendingMessage) && !isScheduledMessage && (
                            <span className="ml0-5 flex-item-noshrink myauto">
                                <span className="badge-label-primary">{c('Info').t`Sending`}</span>
                            </span>
                        )}
                    </div>
                </span>

                {!isNarrow && (
                    <div
                        className="message-header-metas-container flex flex-align-items-center flex-item-noshrink"
                        data-testid="message:message-header-metas"
                    >
                        <span className="message-header-star mr0-5 inline-flex">
                            <ItemStar element={message.data} />
                        </span>
                        {messageLoaded && (
                            <>
                                <span className="inline-flex">
                                    <ItemLocation element={message.data} labelID={labelID} />
                                    <ItemAttachmentIcon
                                        icon={hasOnlyIcsAttachments ? 'calendar-grid' : undefined}
                                        onClick={handleAttachmentIconClick}
                                        element={message.data}
                                        className="mr0-5"
                                    />
                                </span>
                                <ItemDate element={message.data} labelID={labelID} useTooltip className="text-sm" />
                            </>
                        )}
                        {!messageLoaded && <span className="message-header-metas ml0-5 inline-flex" />}
                    </div>
                )}
            </div>
            <div className="flex flex-nowrap flex-align-items-center mb0-5 on-mobile-flex-wrap message-header-ccbcc-container">
                <MailRecipients
                    message={message}
                    recipientsOrGroup={recipientsOrGroup}
                    mapStatusIcons={messageViewIcons.mapStatusIcon}
                    isLoading={!messageLoaded}
                    expanded={showDetails}
                    toggleDetails={toggleDetails}
                    onContactDetails={onContactDetails}
                    onContactEdit={onContactEdit}
                />
            </div>
            {showDetails && (
                <div className="mb0-5 flex flex-nowrap color-weak">
                    <span className="flex-align-self-center mr0-5 text-ellipsis">
                        <ItemDate element={message.data} labelID={labelID} mode="full" useTooltip />
                    </span>
                </div>
            )}

            <HeaderExtra
                message={message}
                sourceMode={sourceMode}
                onResignContact={onResignContact}
                messageLoaded={messageLoaded}
                onLoadRemoteImages={onLoadRemoteImages}
                onLoadEmbeddedImages={onLoadEmbeddedImages}
            />

            {messageLoaded && (
                <>
                    <div className="mb0-85 flex-item-noshrink flex flex-align-items-center message-header-expanded-label-container">
                        <ItemLabels
                            element={message.data}
                            labelID={labelID}
                            labels={labels}
                            isCollapsed={false}
                            className="on-mobile-pt0-25 ml0-5"
                        />
                    </div>
                </>
            )}

            <div className="pt0 flex flex-justify-space-between">
                <div className="flex">
                    <HeaderMoreDropdown
                        labelID={labelID}
                        message={message}
                        messageLoaded={messageLoaded}
                        sourceMode={sourceMode}
                        onBack={onBack}
                        onToggle={onToggle}
                        onSourceMode={onSourceMode}
                        breakpoints={breakpoints}
                        data-testid="message-header-expanded:more-dropdown"
                        parentMessageRef={parentMessageRef}
                        mailSettings={mailSettings}
                        messageViewIcons={messageViewIcons}
                        onContactDetails={onContactDetails}
                        onContactEdit={onContactEdit}
                        labelDropdownToggleRef={labelDropdownToggleRef}
                        moveDropdownToggleRef={moveDropdownToggleRef}
                        filterDropdownToggleRef={filterDropdownToggleRef}
                    />
                </div>
                {!isScheduledMessage && (
                    <ButtonGroup className="mb0-5">
                        <Tooltip title={titleReply}>
                            <Button
                                icon
                                disabled={!messageLoaded || !bodyLoaded || isSendingMessage}
                                onClick={handleCompose(MESSAGE_ACTIONS.REPLY)}
                                data-testid="message-view:reply"
                            >
                                <Icon
                                    name="arrow-up-and-left-big"
                                    className="on-rtl-mirror"
                                    alt={c('Title').t`Reply`}
                                />
                            </Button>
                        </Tooltip>
                        <Tooltip title={titleReplyAll}>
                            <Button
                                icon
                                disabled={!messageLoaded || !bodyLoaded || isSendingMessage}
                                onClick={handleCompose(MESSAGE_ACTIONS.REPLY_ALL)}
                                data-testid="message-view:reply-all"
                            >
                                <Icon
                                    name="arrows-up-and-left-big"
                                    className="on-rtl-mirror"
                                    alt={c('Title').t`Reply all`}
                                />
                            </Button>
                        </Tooltip>
                        <Tooltip title={titleForward}>
                            <Button
                                icon
                                disabled={!messageLoaded || !bodyLoaded || isSendingMessage}
                                onClick={handleCompose(MESSAGE_ACTIONS.FORWARD)}
                                data-testid="message-view:forward"
                            >
                                <Icon
                                    name="arrow-up-and-right-big"
                                    className="on-rtl-mirror"
                                    alt={c('Title').t`Forward`}
                                />
                            </Button>
                        </Tooltip>
                    </ButtonGroup>
                )}
            </div>
            {modals}
        </div>
    );
};

export default HeaderExpanded;
