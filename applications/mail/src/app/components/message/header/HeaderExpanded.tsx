import { MouseEvent } from 'react';
import { Message } from '@proton/shared/lib/interfaces/mail/Message';
import { c } from 'ttag';
import {
    classnames,
    Icon,
    ButtonGroup,
    useToggle,
    useFolders,
    Tooltip,
    useAddresses,
    useMailSettings,
    Button,
    useFeature,
    FeatureCode,
} from '@proton/components';
import { Label } from '@proton/shared/lib/interfaces/Label';
import { MailSettings } from '@proton/shared/lib/interfaces';
import {
    isInternal,
    isOutbox,
    isScheduled,
    getHasOnlyIcsAttachments,
    getRecipients,
} from '@proton/shared/lib/mail/messages';
import { VERIFICATION_STATUS } from '@proton/shared/lib/mail/constants';
import { shiftKey } from '@proton/shared/lib/helpers/browser';
import { scrollIntoView } from '@proton/shared/lib/helpers/dom';
import ItemStar from '../../list/ItemStar';
import ItemDate from '../../list/ItemDate';
import ItemLabels from '../../list/ItemLabels';
import ItemLocation from '../../list/ItemLocation';
import MoveDropdown from '../../dropdown/MoveDropdown';
import LabelDropdown from '../../dropdown/LabelDropdown';
import CustomFilterDropdown from '../../dropdown/CustomFilterDropdown';
import { MessageViewIcons } from '../../../helpers/message/icon';
import { getCurrentFolderID } from '../../../helpers/labels';
import HeaderExtra from './HeaderExtra';
import ItemAttachmentIcon from '../../list/ItemAttachmentIcon';
import HeaderDropdown from './HeaderDropdown';
import HeaderMoreDropdown from './HeaderMoreDropdown';
import RecipientItem from '../recipients/RecipientItem';
import { Breakpoints } from '../../../models/utils';
import { isSelfAddress } from '../../../helpers/addresses';
import { useOnCompose } from '../../../containers/ComposeProvider';
import { MESSAGE_ACTIONS } from '../../../constants';
import ItemSpyTrackerIcon from '../../list/spy-tracker/ItemSpyTrackerIcon';
import { MessageState } from '../../../logic/messages/messagesTypes';
import MailRecipients from '../recipients/MailRecipients';
import RecipientType from '../recipients/RecipientType';
import { useRecipientLabel } from '../../../hooks/contact/useRecipientLabel';

interface Props {
    labelID: string;
    conversationMode: boolean;
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
    conversationMode,
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
    const [folders = []] = useFolders();
    const { state: showDetails, toggle: toggleDetails } = useToggle();
    const selectedIDs = [message.data?.ID || ''];
    const currentFolderID = getCurrentFolderID(message.data?.LabelIDs, folders);
    const isSendingMessage = message.draftFlags?.sending;
    const isOutboxMessage = isOutbox(message.data);
    const { feature } = useFeature(FeatureCode.SpyTrackerProtection);
    const hasOnlyIcsAttachments = getHasOnlyIcsAttachments(message.data?.AttachmentInfo);

    const isScheduledMessage = isScheduled(message.data);

    const [{ Shortcuts } = { Shortcuts: 0 }] = useMailSettings();

    const onCompose = useOnCompose();

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
    const titleFilterOn = Shortcuts ? (
        <>
            {c('Title').t`Filter on`}
            <br />
            <kbd className="border-none">F</kbd>
        </>
    ) : (
        c('Title').t`Filter on`
    );
    const titleMoveTo = Shortcuts ? (
        <>
            {c('Title').t`Move to`}
            <br />
            <kbd className="border-none">M</kbd>
        </>
    ) : (
        c('Title').t`Move to`
    );
    const titleLabelAs = Shortcuts ? (
        <>
            {c('Title').t`Label as`}
            <br />
            <kbd className="border-none">L</kbd>
        </>
    ) : (
        c('Title').t`Label as`
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
            <span className="absolute message-header-security-icons flex flex-row flex-nowrap">
                {feature?.Value && <ItemSpyTrackerIcon message={message} className="ml0-25" />}
            </span>
            {isNarrow && messageLoaded && (
                <div className="flex flex-align-items-center flex-justify-space-between my0-5" onClick={handleClick}>
                    <span className="inline-flex">
                        <ItemLocation element={message.data} labelID={labelID} />
                        <ItemAttachmentIcon
                            icon={hasOnlyIcsAttachments ? 'calendar-days' : undefined}
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
                            <RecipientType label={c('Label').t`From`}>{from}</RecipientType>
                        )}
                        {messageLoaded && (isOutboxMessage || isSendingMessage) && !isScheduledMessage && (
                            <span className="ml0-5 flex-item-noshrink mtauto mbauto">
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
                                        icon={hasOnlyIcsAttachments ? 'calendar-days' : undefined}
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
                bodyLoaded={bodyLoaded}
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
                    />

                    {!isNarrow && (
                        <ButtonGroup className="mr1 mb0-5">
                            <HeaderDropdown
                                icon
                                autoClose={false}
                                content={<Icon name="filter" alt={c('Action').t`Custom filter`} />}
                                className="messageFilterDropdownButton"
                                dropDownClassName="customFilterDropdown"
                                title={titleFilterOn}
                                loading={!messageLoaded}
                                externalToggleRef={filterDropdownToggleRef}
                                data-testid="message-header-expanded:filter-dropdown"
                            >
                                {({ onClose }) => (
                                    <CustomFilterDropdown message={message.data as Message} onClose={onClose} />
                                )}
                            </HeaderDropdown>
                            <HeaderDropdown
                                icon
                                autoClose={false}
                                noMaxSize
                                content={<Icon name="folder" alt={c('Action').t`Move to`} />}
                                className="messageMoveDropdownButton"
                                dropDownClassName="move-dropdown"
                                title={titleMoveTo}
                                loading={!messageLoaded}
                                externalToggleRef={moveDropdownToggleRef}
                                data-testid="message-header-expanded:folder-dropdown"
                            >
                                {({ onClose, onLock }) => (
                                    <MoveDropdown
                                        labelID={currentFolderID}
                                        selectedIDs={selectedIDs}
                                        conversationMode={conversationMode}
                                        onClose={onClose}
                                        onLock={onLock}
                                        onBack={onBack}
                                        breakpoints={breakpoints}
                                    />
                                )}
                            </HeaderDropdown>
                            <HeaderDropdown
                                icon
                                autoClose={false}
                                noMaxSize
                                content={<Icon name="tag" alt={c('Action').t`Label as`} />}
                                className="messageLabelDropdownButton"
                                dropDownClassName="label-dropdown"
                                title={titleLabelAs}
                                loading={!messageLoaded}
                                externalToggleRef={labelDropdownToggleRef}
                                data-testid="message-header-expanded:label-dropdown"
                            >
                                {({ onClose, onLock }) => (
                                    <LabelDropdown
                                        labelID={labelID}
                                        labels={labels}
                                        selectedIDs={selectedIDs}
                                        onClose={onClose}
                                        onLock={onLock}
                                        breakpoints={breakpoints}
                                    />
                                )}
                            </HeaderDropdown>
                        </ButtonGroup>
                    )}
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
                                    name="arrow-up-and-left-double-big"
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
                                <Icon name="arrow-right-big" className="on-rtl-mirror" alt={c('Title').t`Forward`} />
                            </Button>
                        </Tooltip>
                    </ButtonGroup>
                )}
            </div>
            {/* {messageLoaded ? <HeaderAttachmentEvent message={message} /> : null} */}
        </div>
    );
};

export default HeaderExpanded;
