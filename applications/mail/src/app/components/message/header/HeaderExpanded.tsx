import { MouseEvent } from 'react';
import * as React from 'react';
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
    InlineLinkButton,
    Button,
    useFeature,
    FeatureCode,
} from '@proton/components';
import { Label } from '@proton/shared/lib/interfaces/Label';
import { MailSettings } from '@proton/shared/lib/interfaces';
import { isInternal, isOutbox, isScheduled, getHasOnlyIcsAttachments } from '@proton/shared/lib/mail/messages';
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
import MailRecipientsSimple from '../recipients/MailRecipientsSimple';
import RecipientsDetails from '../recipients/RecipientsDetails';
import ItemAttachmentIcon from '../../list/ItemAttachmentIcon';
import HeaderDropdown from './HeaderDropdown';
import HeaderMoreDropdown from './HeaderMoreDropdown';
import HeaderExpandedDetails from './HeaderExpandedDetails';
import RecipientType from '../recipients/RecipientType';
import RecipientItem from '../recipients/RecipientItem';
import { Breakpoints } from '../../../models/utils';
import ItemAction from '../../list/ItemAction';
import EncryptionStatusIcon from '../EncryptionStatusIcon';
import { isSelfAddress } from '../../../helpers/addresses';
import { useOnCompose } from '../../../containers/ComposeProvider';
import { MESSAGE_ACTIONS } from '../../../constants';
import ItemSpyTrackerIcon from '../../list/spy-tracker/ItemSpyTrackerIcon';
import { MessageState } from '../../../logic/messages/messagesTypes';

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
    highlightKeywords?: boolean;
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
    highlightKeywords = false,
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

    const handleAttachmentIconClick = () => {
        scrollIntoView(parentMessageRef.current, { block: 'end' });
    };

    const handleCompose = (action: MESSAGE_ACTIONS) => async () => {
        onCompose({
            action,
            referenceMessage: message,
        });
    };

    const showPinPublicKey =
        isInternal(message.data) &&
        !isSelfAddress(message.data?.Sender.Address, addresses) &&
        message.verification?.signingPublicKey &&
        message.verification?.verificationStatus !== VERIFICATION_STATUS.SIGNED_AND_VALID;

    const from = (
        <RecipientItem
            recipientOrGroup={{ recipient: message.data?.Sender }}
            isLoading={!messageLoaded}
            signingPublicKey={showPinPublicKey ? message.verification?.signingPublicKey : undefined}
            highlightKeywords={highlightKeywords}
        />
    );

    const { isNarrow } = breakpoints;

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
                'message-header message-header-expanded',
                showDetails && 'message-header--showDetails',
                isSentMessage ? 'is-outbound' : 'is-inbound',
                !messageLoaded && 'is-loading',
            ])}
            data-testid={`message-header-expanded:${message.data?.Subject}`}
        >
            <div className="flex flex-nowrap flex-align-items-center cursor-pointer" onClick={handleClick}>
                <span className="flex flex-item-fluid flex-nowrap mr0-5">
                    {showDetails ? (
                        <RecipientType
                            label={c('Label').t`From:`}
                            className={classnames([
                                'flex flex-align-items-start flex-nowrap',
                                !messageLoaded && 'flex-item-fluid',
                            ])}
                        >
                            {from}
                        </RecipientType>
                    ) : (
                        <div className={classnames(['flex flex-nowrap', !messageLoaded && 'flex-item-fluid'])}>
                            {from}
                        </div>
                    )}
                </span>
                <div
                    className={classnames([
                        'message-header-metas-container flex flex-align-items-center flex-item-noshrink',
                        isNarrow && 'flex-align-self-start',
                    ])}
                    data-testid="message:message-header-metas"
                >
                    {messageLoaded && (isOutboxMessage || isSendingMessage) && !isScheduledMessage && (
                        <span className="badge-label-primary mr0-5 flex-item-noshrink">{c('Info').t`Sending`}</span>
                    )}
                    {messageLoaded && isScheduledMessage && (
                        <span className="badge-label-primary mr0-5 flex-item-noshrink">{c('Info').t`Scheduled`}</span>
                    )}
                    {messageLoaded && !showDetails && (
                        <>
                            <span className="inline-flex">
                                <ItemAction element={message.data} className="flex-item-noshrink" />
                                <EncryptionStatusIcon {...messageViewIcons.globalIcon} className="mr0-5" />
                                <ItemLocation element={message.data} labelID={labelID} />
                            </span>
                            {!isNarrow && <ItemDate className="ml0-5" element={message.data} labelID={labelID} />}
                        </>
                    )}
                    {messageLoaded && showDetails && (
                        <span className="ml0-5 inline-flex">
                            <ItemAction element={message.data} className="flex-item-noshrink" />
                        </span>
                    )}
                    {!messageLoaded && <span className="message-header-metas ml0-5 inline-flex" />}
                    <span className="message-header-star ml0-5 inline-flex">
                        <ItemStar element={message.data} />
                    </span>
                </div>
            </div>
            <div
                className={classnames([
                    'flex flex-nowrap flex-align-items-center mb0-5 on-mobile-flex-wrap',
                    !showDetails && 'mt0-5',
                ])}
            >
                <div className="flex-item-fluid flex flex-nowrap mr0-5 on-mobile-mr0 message-header-recipients">
                    {showDetails ? (
                        <RecipientsDetails
                            message={message}
                            mapStatusIcons={messageViewIcons.mapStatusIcon}
                            isLoading={!messageLoaded}
                            highlightKeywords={highlightKeywords}
                        />
                    ) : (
                        <MailRecipientsSimple
                            message={message.data}
                            isLoading={!messageLoaded}
                            highlightKeywords={highlightKeywords}
                        />
                    )}
                    <span
                        className={classnames([
                            'message-show-hide-link-container flex-item-noshrink',
                            showDetails ? 'mt0-25 on-mobile-mt0-5' : 'ml0-5',
                        ])}
                    >
                        {messageLoaded && (
                            <InlineLinkButton
                                onClick={toggleDetails}
                                className="message-show-hide-link"
                                disabled={!messageLoaded}
                                data-testid="message-show-details"
                            >
                                {showDetails
                                    ? c('Action').t`Hide details`
                                    : isNarrow
                                    ? c('Action').t`Details`
                                    : c('Action').t`Show details`}
                            </InlineLinkButton>
                        )}
                    </span>
                </div>
                {messageLoaded && !showDetails && !isNarrow && (
                    <>
                        <div className="flex-item-noshrink flex flex-align-items-center message-header-expanded-label-container">
                            <ItemLabels
                                element={message.data}
                                labelID={labelID}
                                labels={labels}
                                showUnlabel
                                maxNumber={5}
                                className="on-mobile-pt0-25 ml0-5"
                            />
                            {feature?.Value && <ItemSpyTrackerIcon message={message} className="ml0-5" />}
                            <ItemAttachmentIcon
                                icon={hasOnlyIcsAttachments ? 'calendar-days' : undefined}
                                onClick={handleAttachmentIconClick}
                                element={message.data}
                                className="ml0-5"
                            />
                        </div>
                    </>
                )}
            </div>

            {!showDetails && isNarrow && (
                <div className="flex flex-justify-space-between flex-align-items-center border-top pt0-5 mb0-5">
                    {messageLoaded ? (
                        <>
                            <div className="flex flex-nowrap flex-align-items-center">
                                <Icon name="calendar-days" className="ml0-5 mr0-5" />
                                <ItemDate element={message.data} labelID={labelID} />
                            </div>
                            <div className="mlauto flex flex-nowrap flex-align-items-center">
                                {feature?.Value && <ItemSpyTrackerIcon message={message} />}
                                <ItemLabels
                                    element={message.data}
                                    labelID={labelID}
                                    labels={labels}
                                    showUnlabel
                                    maxNumber={1}
                                />
                                <ItemAttachmentIcon
                                    icon={hasOnlyIcsAttachments ? 'calendar-days' : undefined}
                                    onClick={handleAttachmentIconClick}
                                    element={message.data}
                                    className="ml0-5"
                                />
                            </div>
                        </>
                    ) : (
                        <span className="message-header-metas inline-flex" />
                    )}
                </div>
            )}

            {showDetails && (
                <HeaderExpandedDetails
                    labelID={labelID}
                    message={message}
                    messageViewIcons={messageViewIcons}
                    labels={labels}
                    mailSettings={mailSettings}
                    onAttachmentIconClick={handleAttachmentIconClick}
                />
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

            <div className="pt0-5 flex flex-justify-space-between border-top">
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
