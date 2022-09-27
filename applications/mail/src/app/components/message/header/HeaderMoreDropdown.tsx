import { useRef } from 'react';
import { useDispatch } from 'react-redux';
import { useLocation } from 'react-router-dom';

import { c } from 'ttag';

import {
    Button,
    ButtonGroup,
    DropdownMenu,
    DropdownMenuButton,
    Icon,
    Tooltip,
    useApi,
    useEventManager,
    useFolders,
    useLoading,
    useMailSettings,
    useModalState,
} from '@proton/components';
import { ContactEditProps } from '@proton/components/containers/contacts/edit/ContactEditModal';
import { WorkerDecryptionResult } from '@proton/crypto';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import downloadFile from '@proton/shared/lib/helpers/downloadFile';
import { MailSettings } from '@proton/shared/lib/interfaces';
import { Message } from '@proton/shared/lib/interfaces/mail/Message';

import { formatFileNameDate } from '../../../helpers/date';
import { isStarred as IsMessageStarred, getDate } from '../../../helpers/elements';
import { getCurrentFolderID, getFolderName } from '../../../helpers/labels';
import { isConversationMode } from '../../../helpers/mailSettings';
import { MessageViewIcons } from '../../../helpers/message/icon';
import { exportBlob } from '../../../helpers/message/messageExport';
import { MARK_AS_STATUS, useMarkAs } from '../../../hooks/actions/useMarkAs';
import { useMoveToFolder } from '../../../hooks/actions/useMoveToFolder';
import { useStar } from '../../../hooks/actions/useStar';
import { useGetMessageKeys } from '../../../hooks/message/useGetMessageKeys';
import { useGetAttachment } from '../../../hooks/useAttachment';
import { updateAttachment } from '../../../logic/attachments/attachmentsActions';
import { MessageState, MessageStateWithData, MessageWithOptionalBody } from '../../../logic/messages/messagesTypes';
import { Element } from '../../../models/element';
import { Breakpoints } from '../../../models/utils';
import CustomFilterDropdown from '../../dropdown/CustomFilterDropdown';
import LabelDropdown from '../../dropdown/LabelDropdown';
import MoveDropdown from '../../dropdown/MoveDropdown';
import MessageDetailsModal from '../modals/MessageDetailsModal';
import MessageHeadersModal from '../modals/MessageHeadersModal';
import MessagePermanentDeleteModal from '../modals/MessagePermanentDeleteModal';
import MessagePhishingModal from '../modals/MessagePhishingModal';
import MessagePrintModal from '../modals/MessagePrintModal';
import HeaderDropdown, { DropdownRender } from './HeaderDropdown';

const { INBOX, TRASH, SPAM, ARCHIVE } = MAILBOX_LABEL_IDS;

interface Props {
    labelID: string;
    message: MessageState;
    messageLoaded: boolean;
    sourceMode: boolean;
    onBack: () => void;
    onToggle: () => void;
    onSourceMode: (sourceMode: boolean) => void;
    breakpoints: Breakpoints;
    parentMessageRef: React.RefObject<HTMLElement>;
    mailSettings: MailSettings;
    messageViewIcons: MessageViewIcons;
    onContactDetails: (contactID: string) => void;
    onContactEdit: (props: ContactEditProps) => void;
    labelDropdownToggleRef: React.MutableRefObject<() => void>;
    moveDropdownToggleRef: React.MutableRefObject<() => void>;
    filterDropdownToggleRef: React.MutableRefObject<() => void>;
}

const HeaderMoreDropdown = ({
    labelID,
    message,
    messageLoaded,
    sourceMode,
    onBack,
    onToggle,
    onSourceMode,
    breakpoints,
    parentMessageRef,
    mailSettings,
    messageViewIcons,
    onContactDetails,
    onContactEdit,
    labelDropdownToggleRef,
    moveDropdownToggleRef,
    filterDropdownToggleRef,
}: Props) => {
    const location = useLocation();
    const api = useApi();
    const getAttachment = useGetAttachment();
    const dispatch = useDispatch();
    const [loading, withLoading] = useLoading();
    const star = useStar();
    const { call } = useEventManager();
    const closeDropdown = useRef<() => void>();
    const { moveToFolder, moveScheduledModal, moveAllModal, moveToSpamModal } = useMoveToFolder();
    const [folders = []] = useFolders();
    const markAs = useMarkAs();
    const getMessageKeys = useGetMessageKeys();
    const [{ Shortcuts = 0 } = {}] = useMailSettings();

    const [messageDetailsModalProps, setMessageDetailsModalOpen] = useModalState();
    const [messageHeaderModalProps, setMessageHeaderModalOpen] = useModalState();
    const [messagePrintModalProps, setMessagePrintModalOpen, renderPrintModal] = useModalState();
    const [messagePhishingModalProps, setMessagePhishingModalOpen] = useModalState();
    const [messagePermanentDeleteModalProps, setMessagePermanentDeleteModalOpen] = useModalState();

    const isStarred = IsMessageStarred(message.data || ({} as Element));

    const staringText = isStarred ? c('Action').t`Unstar` : c('Action').t`Star`;

    const handleMove = (folderID: string, fromFolderID: string) => async () => {
        closeDropdown.current?.();
        const folderName = getFolderName(folderID, folders);
        await moveToFolder([message.data || ({} as Element)], folderID, folderName, fromFolderID, false);
    };

    const handleUnread = async () => {
        closeDropdown.current?.();
        onToggle();
        if (isConversationMode(labelID, mailSettings, location)) {
            parentMessageRef.current?.focus();
        } else {
            onBack();
        }
        markAs([message.data as Element], labelID, MARK_AS_STATUS.UNREAD);
        await call();
    };

    const onUpdateAttachment = (ID: string, attachment: WorkerDecryptionResult<Uint8Array>) => {
        dispatch(updateAttachment({ ID, attachment }));
    };

    const handleExport = async () => {
        // Angular/src/app/message/directives/actionMessage.js
        const messageKeys = await getMessageKeys(message.data as Message);
        const { Subject = '' } = message.data || {};
        const time = formatFileNameDate(getDate(message.data, labelID));
        const blob = await exportBlob(message, messageKeys, getAttachment, onUpdateAttachment, api);
        const filename = `${Subject} ${time}.eml`;
        downloadFile(blob, filename);
    };

    const handleStar = async () => {
        if (!loading) {
            void withLoading(star([message.data || ({} as Element)], !isStarred));
        }
    };

    const messageLabelIDs = message.data?.LabelIDs || [];
    const selectedIDs = [message.data?.ID || ''];
    const isSpam = messageLabelIDs.includes(SPAM);
    const isInTrash = messageLabelIDs.includes(TRASH);
    const fromFolderID = getCurrentFolderID(messageLabelIDs, folders);
    const { isNarrow } = breakpoints;
    const additionalDropdowns: DropdownRender[] | undefined = isNarrow
        ? [
              ({ onClose, onLock }) => (
                  <MoveDropdown
                      labelID={fromFolderID}
                      selectedIDs={selectedIDs}
                      conversationMode={false}
                      onClose={onClose}
                      onLock={onLock}
                      onBack={onBack}
                      breakpoints={breakpoints}
                  />
              ),
              ({ onClose, onLock }) => (
                  <LabelDropdown
                      labelID={labelID}
                      selectedIDs={selectedIDs}
                      onClose={onClose}
                      onLock={onLock}
                      breakpoints={breakpoints}
                  />
              ),
              ({ onClose, onLock }) => (
                  <CustomFilterDropdown message={message.data as Message} onClose={onClose} onLock={onLock} />
              ),
          ]
        : undefined;

    const titleMoveInboxNotSpam = Shortcuts ? (
        <>
            {c('Title').t`Move to inbox (not spam)`}
            <br />
            <kbd className="border-none">I</kbd>
        </>
    ) : (
        c('Title').t`Move to inbox (not spam)`
    );
    const titleUnread = Shortcuts ? (
        <>
            {c('Title').t`Mark as unread`}
            <br />
            <kbd className="border-none">U</kbd>
        </>
    ) : (
        c('Title').t`Mark as unread`
    );
    const titleMoveInbox = Shortcuts ? (
        <>
            {c('Title').t`Move to inbox`}
            <br />
            <kbd className="border-none">I</kbd>
        </>
    ) : (
        c('Title').t`Move to inbox`
    );
    const titleMoveTrash = Shortcuts ? (
        <>
            {c('Title').t`Move to trash`}
            <br />
            <kbd className="border-none">T</kbd>
        </>
    ) : (
        c('Title').t`Move to trash`
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
    const titleFilterOn = Shortcuts ? (
        <>
            {c('Title').t`Filter on...`}
            <br />
            <kbd className="border-none">F</kbd>
        </>
    ) : (
        c('Title').t`Filter on...`
    );

    return (
        <>
            <ButtonGroup className="mr1 mb0-5">
                {isSpam ? (
                    <Tooltip title={titleMoveInboxNotSpam}>
                        <Button icon disabled={!messageLoaded} onClick={handleMove(INBOX, SPAM)}>
                            <Icon name="fire-slash" alt={c('Title').t`Move to inbox (not spam)`} />
                        </Button>
                    </Tooltip>
                ) : (
                    <Tooltip title={titleUnread}>
                        <Button
                            icon
                            disabled={!messageLoaded}
                            onClick={handleUnread}
                            data-testid="message-header-expanded:mark-as-unread"
                        >
                            <Icon name="envelope-dot" alt={c('Title').t`Mark as unread`} />
                        </Button>
                    </Tooltip>
                )}
                {isInTrash ? (
                    <Tooltip title={titleMoveInbox}>
                        <Button icon disabled={!messageLoaded} onClick={handleMove(INBOX, TRASH)}>
                            <Icon name="inbox" alt={c('Title').t`Move to inbox`} />
                        </Button>
                    </Tooltip>
                ) : (
                    <Tooltip title={titleMoveTrash}>
                        <Button
                            icon
                            disabled={!messageLoaded}
                            onClick={handleMove(TRASH, fromFolderID)}
                            data-testid="message-header-expanded:move-to-trash"
                        >
                            <Icon name="trash" alt={c('Title').t`Move to trash`} />
                        </Button>
                    </Tooltip>
                )}
                {!isNarrow && [
                    <HeaderDropdown
                        key="message-header-expanded:folder-dropdown"
                        icon
                        autoClose={false}
                        noMaxSize
                        content={<Icon name="folder-arrow-in" alt={c('Action').t`Move to`} />}
                        className="messageMoveDropdownButton"
                        dropDownClassName="move-dropdown"
                        title={titleMoveTo}
                        loading={!messageLoaded}
                        externalToggleRef={moveDropdownToggleRef}
                        data-testid="message-header-expanded:folder-dropdown"
                    >
                        {({ onClose, onLock }) => (
                            <MoveDropdown
                                labelID={fromFolderID}
                                selectedIDs={selectedIDs}
                                conversationMode={false}
                                onClose={onClose}
                                onLock={onLock}
                                onBack={onBack}
                                breakpoints={breakpoints}
                            />
                        )}
                    </HeaderDropdown>,
                    <HeaderDropdown
                        key="message-header-expanded:label-dropdown"
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
                                selectedIDs={selectedIDs}
                                onClose={onClose}
                                onLock={onLock}
                                breakpoints={breakpoints}
                            />
                        )}
                    </HeaderDropdown>,
                    <HeaderDropdown
                        key="message-header-expanded:filter-dropdown"
                        icon
                        autoClose={false}
                        noMaxSize
                        content={<Icon name="filter" alt={c('Action').t`Filter on...`} />}
                        className="messageFilterDropdownButton"
                        dropDownClassName="filter-dropdown"
                        title={titleFilterOn}
                        loading={!messageLoaded}
                        externalToggleRef={filterDropdownToggleRef}
                        data-testid="message-header-expanded:filter-dropdown"
                    >
                        {({ onClose, onLock }) => (
                            <CustomFilterDropdown message={message.data as Message} onClose={onClose} onLock={onLock} />
                        )}
                    </HeaderDropdown>,
                ]}
                <HeaderDropdown
                    icon
                    disabled={!messageLoaded}
                    autoClose
                    title={c('Title').t`More`}
                    content={<Icon name="three-dots-horizontal" alt={c('Title').t`More options`} />}
                    additionalDropdowns={additionalDropdowns}
                    data-testid="message-header-expanded:more-dropdown"
                    noMaxHeight
                    noMaxSize
                >
                    {({ onClose, onOpenAdditionnal }) => {
                        closeDropdown.current = onClose;
                        return (
                            <DropdownMenu>
                                <DropdownMenuButton
                                    className="text-left flex flex-nowrap flex-align-items-center"
                                    onClick={handleStar}
                                >
                                    <Icon name={isStarred ? 'star-slash' : 'star'} className="mr0-5" />
                                    <span className="flex-item-fluid myauto">{staringText}</span>
                                </DropdownMenuButton>

                                <hr className="my0-5" />

                                <DropdownMenuButton
                                    className="text-left flex flex-nowrap flex-align-items-center"
                                    onClick={handleMove(ARCHIVE, fromFolderID)}
                                >
                                    <Icon name="archive-box" className="mr0-5" />
                                    <span className="flex-item-fluid myauto">{c('Action').t`Archive`}</span>
                                </DropdownMenuButton>
                                {isNarrow && (
                                    <DropdownMenuButton
                                        className="text-left flex flex-nowrap flex-align-items-center"
                                        onClick={() => onOpenAdditionnal(0)}
                                    >
                                        <Icon name="folder-arrow-in" className="mr0-5" />
                                        <span className="flex-item-fluid mtauto mbauto">{c('Action')
                                            .t`Move to...`}</span>
                                    </DropdownMenuButton>
                                )}
                                {isNarrow && (
                                    <DropdownMenuButton
                                        className="text-left flex flex-nowrap flex-align-items-center"
                                        onClick={() => onOpenAdditionnal(1)}
                                    >
                                        <Icon name="tag" className="mr0-5" />
                                        <span className="flex-item-fluid myauto">{c('Action').t`Label as...`}</span>
                                    </DropdownMenuButton>
                                )}
                                {isNarrow && (
                                    <DropdownMenuButton
                                        className="text-left flex flex-nowrap flex-align-items-center"
                                        onClick={() => onOpenAdditionnal(2)}
                                    >
                                        <Icon name="filter" className="mr0-5" />
                                        <span className="flex-item-fluid mtauto mbauto">{c('Action')
                                            .t`Filter on...`}</span>
                                    </DropdownMenuButton>
                                )}
                                {isSpam ? (
                                    <DropdownMenuButton
                                        className="text-left flex flex-nowrap flex-align-items-center"
                                        onClick={handleUnread}
                                    >
                                        <Icon name="eye-slash" className="mr0-5" />
                                        <span className="flex-item-fluid myauto">{c('Action').t`Mark as unread`}</span>
                                    </DropdownMenuButton>
                                ) : (
                                    <DropdownMenuButton
                                        className="text-left flex flex-nowrap flex-align-items-center"
                                        onClick={handleMove(SPAM, fromFolderID)}
                                    >
                                        <Icon name="fire" className="mr0-5" />
                                        <span className="flex-item-fluid myauto">{c('Action').t`Move to spam`}</span>
                                    </DropdownMenuButton>
                                )}
                                {isInTrash ? (
                                    <DropdownMenuButton
                                        className="text-left flex flex-nowrap flex-align-items-center"
                                        onClick={() => setMessagePermanentDeleteModalOpen(true)}
                                    >
                                        <Icon name="cross-circle" className="mr0-5" />
                                        <span className="flex-item-fluid myauto">{c('Action').t`Delete`}</span>
                                    </DropdownMenuButton>
                                ) : null}

                                <hr className="my0-5" />

                                <DropdownMenuButton
                                    className="text-left flex flex-nowrap flex-align-items-center"
                                    onClick={handleExport}
                                >
                                    <Icon name="arrow-up-from-square" className="mr0-5" />
                                    <span className="flex-item-fluid myauto">{c('Action').t`Export`}</span>
                                </DropdownMenuButton>
                                <DropdownMenuButton
                                    className="text-left flex flex-nowrap flex-align-items-center"
                                    onClick={() => setMessagePrintModalOpen(true)}
                                >
                                    <Icon name="printer" className="mr0-5" />
                                    <span className="flex-item-fluid myauto">{c('Action').t`Print`}</span>
                                </DropdownMenuButton>

                                <hr className="my0-5" />

                                <DropdownMenuButton
                                    className="text-left flex flex-nowrap flex-align-items-center"
                                    onClick={() => setMessageDetailsModalOpen(true)}
                                >
                                    <Icon name="list-bullets" className="mr0-5" />
                                    <span className="flex-item-fluid myauto">{c('Action')
                                        .t`View message details`}</span>
                                </DropdownMenuButton>
                                <DropdownMenuButton
                                    className="text-left flex flex-nowrap flex-align-items-center"
                                    onClick={() => setMessageHeaderModalOpen(true)}
                                >
                                    <Icon name="window-terminal" className="mr0-5" />
                                    <span className="flex-item-fluid myauto">{c('Action').t`View headers`}</span>
                                </DropdownMenuButton>
                                {!sourceMode && (
                                    <DropdownMenuButton
                                        className="text-left flex flex-nowrap flex-align-items-center"
                                        onClick={() => onSourceMode(true)}
                                    >
                                        <Icon name="code" className="mr0-5" />
                                        <span className="flex-item-fluid myauto">{c('Action').t`View HTML`}</span>
                                    </DropdownMenuButton>
                                )}
                                {sourceMode && (
                                    <DropdownMenuButton
                                        className="text-left flex flex-nowrap flex-align-items-center"
                                        onClick={() => onSourceMode(false)}
                                    >
                                        <Icon name="window-image" className="mr0-5" />
                                        <span className="flex-item-fluid myauto">{c('Action')
                                            .t`View rendered HTML`}</span>
                                    </DropdownMenuButton>
                                )}

                                <hr className="my0-5" />

                                <DropdownMenuButton
                                    className="text-left flex flex-nowrap flex-align-items-center color-danger"
                                    onClick={() => setMessagePhishingModalOpen(true)}
                                >
                                    <Icon name="hook" className="mr0-5" />
                                    <span className="flex-item-fluid myauto">{c('Action').t`Report phishing`}</span>
                                </DropdownMenuButton>
                            </DropdownMenu>
                        );
                    }}
                </HeaderDropdown>
            </ButtonGroup>
            <MessageDetailsModal
                labelID={labelID}
                message={message}
                mailSettings={mailSettings}
                messageViewIcons={messageViewIcons}
                messageLoaded={messageLoaded}
                onContactDetails={onContactDetails}
                onContactEdit={onContactEdit}
                {...messageDetailsModalProps}
            />
            <MessageHeadersModal message={message.data} {...messageHeaderModalProps} />
            {renderPrintModal && (
                <MessagePrintModal
                    message={message as MessageStateWithData}
                    labelID={labelID}
                    {...messagePrintModalProps}
                />
            )}
            <MessagePhishingModal message={message} onBack={onBack} {...messagePhishingModalProps} />
            <MessagePermanentDeleteModal
                message={message.data as MessageWithOptionalBody}
                {...messagePermanentDeleteModalProps}
            />
            {moveScheduledModal}
            {moveAllModal}
            {moveToSpamModal}
        </>
    );
};

export default HeaderMoreDropdown;
