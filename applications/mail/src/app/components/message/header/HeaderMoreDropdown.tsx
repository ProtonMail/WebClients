import { useRef } from 'react';
import { useLocation } from 'react-router-dom';

import { addDays } from 'date-fns';
import { c } from 'ttag';

import { Button, Kbd } from '@proton/atoms';
import type { Breakpoints, ContactEditProps } from '@proton/components';
import {
    ButtonGroup,
    DropdownMenu,
    DropdownMenuButton,
    DropdownSizeUnit,
    Icon,
    Tooltip,
    useApi,
    useFolders,
    useModalState,
    useNotifications,
    useUser,
} from '@proton/components';
import type { WorkerDecryptionResult } from '@proton/crypto';
import { FeatureCode, useFeature } from '@proton/features';
import { useLoading } from '@proton/hooks';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import downloadFile from '@proton/shared/lib/helpers/downloadFile';
import type { MailSettings } from '@proton/shared/lib/interfaces';
import type { Message } from '@proton/shared/lib/interfaces/mail/Message';
import { MARK_AS_STATUS } from '@proton/shared/lib/mail/constants';

import useMailModel from 'proton-mail/hooks/useMailModel';
import { useMailDispatch } from 'proton-mail/store/hooks';

import { formatFileNameDate } from '../../../helpers/date';
import { isStarred as IsMessageStarred, getDate } from '../../../helpers/elements';
import { canSetExpiration, getExpirationTime } from '../../../helpers/expiration';
import { getCurrentFolderID, getFolderName } from '../../../helpers/labels';
import { isConversationMode } from '../../../helpers/mailSettings';
import type { MessageViewIcons } from '../../../helpers/message/icon';
import { exportBlob } from '../../../helpers/message/messageExport';
import { useMarkAs } from '../../../hooks/actions/markAs/useMarkAs';
import { useMoveToFolder } from '../../../hooks/actions/move/useMoveToFolder';
import { useStar } from '../../../hooks/actions/useStar';
import { useGetAttachment } from '../../../hooks/attachments/useAttachment';
import { useGetMessageKeys } from '../../../hooks/message/useGetMessageKeys';
import type { Element } from '../../../models/element';
import { updateAttachment } from '../../../store/attachments/attachmentsActions';
import { expireMessages } from '../../../store/messages/expire/messagesExpireActions';
import type {
    MessageState,
    MessageStateWithData,
    MessageWithOptionalBody,
} from '../../../store/messages/messagesTypes';
import CustomFilterDropdown from '../../dropdown/CustomFilterDropdown';
import LabelDropdown, { labelDropdownContentProps } from '../../dropdown/LabelDropdown';
import MoveDropdown, { moveDropdownContentProps } from '../../dropdown/MoveDropdown';
import CustomExpirationModal from '../modals/CustomExpirationModal';
import MessageDetailsModal from '../modals/MessageDetailsModal';
import MessageHeadersModal from '../modals/MessageHeadersModal';
import MessagePermanentDeleteModal from '../modals/MessagePermanentDeleteModal';
import MessagePhishingModal from '../modals/MessagePhishingModal';
import MessagePrintModal from '../modals/MessagePrintModal';
import type { DropdownRender } from './HeaderDropdown';
import HeaderDropdown from './HeaderDropdown';
import { MESSAGE_FILTER_DROPDOWN_ID, MESSAGE_FOLDER_DROPDOWN_ID, MESSAGE_LABEL_DROPDOWN_ID } from './constants';

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
    const { createNotification } = useNotifications();
    const dispatch = useMailDispatch();
    const [loading, withLoading] = useLoading();
    const star = useStar();
    const [user] = useUser();
    const { feature } = useFeature(FeatureCode.SetExpiration);
    const closeDropdown = useRef<() => void>();
    const { moveToFolder, moveScheduledModal, moveSnoozedModal, moveToSpamModal } = useMoveToFolder();
    const [folders = []] = useFolders();
    const { markAs } = useMarkAs();
    const getMessageKeys = useGetMessageKeys();
    const { Shortcuts } = useMailModel('MailSettings');
    const [CustomExpirationModalProps, openCustomExpirationModal, renderCustomExpirationModal] = useModalState();

    const [messageDetailsModalProps, setMessageDetailsModalOpen, renderMessageDetailsModal] = useModalState();
    const [messageHeaderModalProps, setMessageHeaderModalOpen, renderMessageHeaderModal] = useModalState();
    const [messagePrintModalProps, setMessagePrintModalOpen, renderPrintModal] = useModalState();
    const [messagePhishingModalProps, setMessagePhishingModalOpen, renderMessagePhishingModal] = useModalState();
    const [messagePermanentDeleteModalProps, setMessagePermanentDeleteModalOpen, renderMessagePermanentDeleteModal] =
        useModalState();
    const canExpire = canSetExpiration(feature?.Value, user, message);
    const isStarred = IsMessageStarred(message.data || ({} as Element));
    const messageID = message.data?.ID || '';
    const staringText = isStarred ? c('Action').t`Unstar` : c('Action').t`Star`;
    const willExpire = !!message.data?.ExpirationTime;

    const handleMove = (folderID: string, fromFolderID: string) => async () => {
        closeDropdown.current?.();
        const folderName = getFolderName(folderID, folders);
        await moveToFolder({
            elements: [message.data || ({} as Element)],
            sourceLabelID: fromFolderID,
            destinationLabelID: folderID,
            folderName,
        });
    };

    const handleUnread = async () => {
        closeDropdown.current?.();
        onToggle();
        if (isConversationMode(labelID, mailSettings, location)) {
            parentMessageRef.current?.focus();
        } else {
            onBack();
        }
        void markAs({
            elements: [message.data as Element],
            labelID,
            status: MARK_AS_STATUS.UNREAD,
        });
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

    const handleExpire = (days: number) => {
        const date = days ? addDays(new Date(), days) : undefined;
        const expirationTime = getExpirationTime(date);
        void dispatch(
            expireMessages({
                IDs: [messageID],
                conversationID: message.data?.ConversationID,
                expirationTime,
            })
        );

        createNotification({
            text: days ? c('Success').t`Self-destruction set` : c('Success').t`Self-destruction removed`,
        });
    };

    const handleCustomExpiration = (expirationDate: Date) => {
        const expirationTime = getExpirationTime(expirationDate);
        void dispatch(
            expireMessages({
                IDs: [messageID],
                conversationID: message.data?.ConversationID,
                expirationTime,
            })
        );
        openCustomExpirationModal(false);
        createNotification({ text: c('Success').t`Self-destruction set` });
    };

    const messageLabelIDs = message.data?.LabelIDs || [];
    const selectedIDs = [messageID];
    const isSpam = messageLabelIDs.includes(SPAM);
    const isInTrash = messageLabelIDs.includes(TRASH);
    const fromFolderID = getCurrentFolderID(messageLabelIDs, folders);
    const { viewportWidth } = breakpoints;
    const additionalDropdowns: DropdownRender[] | undefined = viewportWidth['<=small']
        ? [
              {
                  contentProps: moveDropdownContentProps,
                  render: ({ onClose, onLock }) => (
                      <MoveDropdown
                          labelID={fromFolderID}
                          selectedIDs={selectedIDs}
                          onClose={onClose}
                          onLock={onLock}
                          breakpoints={breakpoints}
                          isMessage
                      />
                  ),
              },
              {
                  contentProps: labelDropdownContentProps,
                  render: ({ onClose, onLock }) => (
                      <LabelDropdown
                          labelID={labelID}
                          selectedIDs={selectedIDs}
                          onClose={onClose}
                          onLock={onLock}
                          breakpoints={breakpoints}
                      />
                  ),
              },
              {
                  render: ({ onClose, onLock }) => (
                      <CustomFilterDropdown message={message.data as Message} onClose={onClose} onLock={onLock} />
                  ),
              },
          ]
        : undefined;

    const titleMoveInboxNotSpam = Shortcuts ? (
        <>
            {c('Title').t`Move to inbox (not spam)`}
            <br />
            <Kbd shortcut="I" />
        </>
    ) : (
        c('Title').t`Move to inbox (not spam)`
    );
    const titleUnread = Shortcuts ? (
        <>
            {c('Title').t`Mark as unread`}
            <br />
            <Kbd shortcut="U" />
        </>
    ) : (
        c('Title').t`Mark as unread`
    );
    const titleMoveInbox = Shortcuts ? (
        <>
            {c('Title').t`Move to inbox`}
            <br />
            <Kbd shortcut="I" />
        </>
    ) : (
        c('Title').t`Move to inbox`
    );
    const titleMoveTrash = Shortcuts ? (
        <>
            {c('Title').t`Move to trash`}
            <br />
            <Kbd shortcut="T" />
        </>
    ) : (
        c('Title').t`Move to trash`
    );
    const titleMoveTo = Shortcuts ? (
        <>
            {c('Title').t`Move to`}
            <br />
            <Kbd shortcut="M" />
        </>
    ) : (
        c('Title').t`Move to`
    );
    const titleLabelAs = Shortcuts ? (
        <>
            {c('Title').t`Label as`}
            <br />
            <Kbd shortcut="L" />
        </>
    ) : (
        c('Title').t`Label as`
    );
    const titleFilterOn = Shortcuts ? (
        <>
            {c('Title').t`Filter on...`}
            <br />
            <Kbd shortcut="F" />
        </>
    ) : (
        c('Title').t`Filter on...`
    );

    return (
        <>
            <ButtonGroup className="mr-4 mb-2">
                {isSpam ? (
                    <Tooltip title={titleMoveInboxNotSpam}>
                        <Button
                            icon
                            disabled={!messageLoaded}
                            onClick={handleMove(INBOX, SPAM)}
                            data-testid="message-header-expanded:move-spam-to-inbox"
                        >
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
                        <Button
                            icon
                            disabled={!messageLoaded}
                            onClick={handleMove(INBOX, TRASH)}
                            data-testid="message-header-expanded:move-trashed-to-inbox"
                        >
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
                {!viewportWidth['<=small'] && [
                    <HeaderDropdown
                        key={MESSAGE_FOLDER_DROPDOWN_ID}
                        id={MESSAGE_FOLDER_DROPDOWN_ID}
                        icon
                        autoClose={false}
                        dropdownSize={{ maxWidth: '22em', maxHeight: DropdownSizeUnit.Viewport }}
                        content={<Icon name="folder-arrow-in" alt={c('Action').t`Move to`} />}
                        className="messageMoveDropdownButton"
                        dropDownClassName="move-dropdown"
                        title={titleMoveTo}
                        loading={!messageLoaded}
                        externalToggleRef={moveDropdownToggleRef}
                        data-testid={MESSAGE_FOLDER_DROPDOWN_ID}
                    >
                        {{
                            contentProps: moveDropdownContentProps,
                            render: ({ onClose, onLock }) => (
                                <MoveDropdown
                                    labelID={fromFolderID}
                                    selectedIDs={selectedIDs}
                                    onClose={onClose}
                                    onLock={onLock}
                                    breakpoints={breakpoints}
                                    isMessage
                                />
                            ),
                        }}
                    </HeaderDropdown>,
                    <HeaderDropdown
                        key={MESSAGE_LABEL_DROPDOWN_ID}
                        id={MESSAGE_LABEL_DROPDOWN_ID}
                        icon
                        autoClose={false}
                        dropdownSize={{ maxWidth: '22em', maxHeight: DropdownSizeUnit.Viewport }}
                        content={<Icon name="tag" alt={c('Action').t`Label as`} />}
                        className="messageLabelDropdownButton"
                        dropDownClassName="label-dropdown"
                        title={titleLabelAs}
                        loading={!messageLoaded}
                        externalToggleRef={labelDropdownToggleRef}
                        data-testid={MESSAGE_LABEL_DROPDOWN_ID}
                    >
                        {{
                            contentProps: labelDropdownContentProps,
                            render: ({ onClose, onLock }) => (
                                <LabelDropdown
                                    labelID={labelID}
                                    selectedIDs={selectedIDs}
                                    onClose={onClose}
                                    onLock={onLock}
                                    breakpoints={breakpoints}
                                />
                            ),
                        }}
                    </HeaderDropdown>,
                    <HeaderDropdown
                        key={MESSAGE_FILTER_DROPDOWN_ID}
                        id={MESSAGE_FILTER_DROPDOWN_ID}
                        icon
                        autoClose={false}
                        dropdownSize={{ maxWidth: DropdownSizeUnit.Viewport, maxHeight: DropdownSizeUnit.Viewport }}
                        content={<Icon name="filter" alt={c('Action').t`Filter on...`} />}
                        className="messageFilterDropdownButton"
                        dropDownClassName="filter-dropdown"
                        title={titleFilterOn}
                        loading={!messageLoaded}
                        externalToggleRef={filterDropdownToggleRef}
                        data-testid={MESSAGE_FILTER_DROPDOWN_ID}
                    >
                        {{
                            render: ({ onClose, onLock }) => (
                                <CustomFilterDropdown
                                    message={message.data as Message}
                                    onClose={onClose}
                                    onLock={onLock}
                                />
                            ),
                        }}
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
                    dropdownSize={{ maxWidth: DropdownSizeUnit.Viewport, maxHeight: DropdownSizeUnit.Viewport }}
                >
                    {{
                        render: ({ onClose, onOpenAdditional }) => {
                            closeDropdown.current = onClose;
                            return (
                                <DropdownMenu>
                                    <DropdownMenuButton
                                        className="text-left flex flex-nowrap items-center"
                                        onClick={handleStar}
                                        data-testid="message-view-more-dropdown:star"
                                    >
                                        <Icon name={isStarred ? 'star-slash' : 'star'} className="mr-2" />
                                        <span className="flex-1 my-auto">{staringText}</span>
                                    </DropdownMenuButton>

                                    <hr className="my-2" />

                                    <DropdownMenuButton
                                        className="text-left flex flex-nowrap items-center"
                                        onClick={handleMove(ARCHIVE, fromFolderID)}
                                        data-testid="message-view-more-dropdown:archive"
                                    >
                                        <Icon name="archive-box" className="mr-2" />
                                        <span className="flex-1 my-auto">{c('Action').t`Archive`}</span>
                                    </DropdownMenuButton>
                                    {viewportWidth['<=small'] && (
                                        <DropdownMenuButton
                                            className="text-left flex flex-nowrap items-center"
                                            onClick={() => onOpenAdditional(0)}
                                        >
                                            <Icon name="folder-arrow-in" className="mr-2" />
                                            <span className="flex-1 my-auto">{c('Action').t`Move to...`}</span>
                                        </DropdownMenuButton>
                                    )}
                                    {viewportWidth['<=small'] && (
                                        <DropdownMenuButton
                                            className="text-left flex flex-nowrap items-center"
                                            onClick={() => onOpenAdditional(1)}
                                        >
                                            <Icon name="tag" className="mr-2" />
                                            <span className="flex-1 my-auto">{c('Action').t`Label as...`}</span>
                                        </DropdownMenuButton>
                                    )}
                                    {viewportWidth['<=small'] && (
                                        <DropdownMenuButton
                                            className="text-left flex flex-nowrap items-center"
                                            onClick={() => onOpenAdditional(2)}
                                        >
                                            <Icon name="filter" className="mr-2" />
                                            <span className="flex-1 my-auto">{c('Action').t`Filter on...`}</span>
                                        </DropdownMenuButton>
                                    )}
                                    {isSpam ? (
                                        <DropdownMenuButton
                                            className="text-left flex flex-nowrap items-center"
                                            onClick={handleUnread}
                                            data-testid="message-view-more-dropdown:unread"
                                        >
                                            <Icon name="eye-slash" className="mr-2" />
                                            <span className="flex-1 my-auto">{c('Action').t`Mark as unread`}</span>
                                        </DropdownMenuButton>
                                    ) : (
                                        <DropdownMenuButton
                                            className="text-left flex flex-nowrap items-center"
                                            onClick={handleMove(SPAM, fromFolderID)}
                                            data-testid="message-view-more-dropdown:move-to-spam"
                                        >
                                            <Icon name="fire" className="mr-2" />
                                            <span className="flex-1 my-auto">{c('Action').t`Move to spam`}</span>
                                        </DropdownMenuButton>
                                    )}
                                    {isInTrash ? (
                                        <DropdownMenuButton
                                            className="text-left flex flex-nowrap items-center"
                                            onClick={() => setMessagePermanentDeleteModalOpen(true)}
                                            data-testid="message-view-more-dropdown:delete"
                                        >
                                            <Icon name="cross-circle" className="mr-2" />
                                            <span className="flex-1 my-auto">{c('Action').t`Delete`}</span>
                                        </DropdownMenuButton>
                                    ) : null}
                                    {canExpire ? (
                                        <>
                                            <hr className="my-2" />
                                            {willExpire ? (
                                                <DropdownMenuButton
                                                    className="text-left flex flex-nowrap items-center"
                                                    onClick={() => handleExpire(0)}
                                                    data-testid="message-view-more-dropdown:remove-expiration"
                                                >
                                                    <Icon name="hourglass" className="mr-2" />
                                                    <span className="flex-1 my-auto">{c('Action')
                                                        .t`Remove self-destruction`}</span>
                                                </DropdownMenuButton>
                                            ) : (
                                                <>
                                                    <DropdownMenuButton
                                                        className="text-left flex flex-nowrap items-center"
                                                        onClick={() => handleExpire(7)}
                                                        data-testid="message-view-more-dropdown:expire-7-days"
                                                    >
                                                        <Icon name="hourglass" className="mr-2" />
                                                        <span className="flex-1 my-auto">{c('Action')
                                                            .t`Self-destruct in 7 days`}</span>
                                                    </DropdownMenuButton>
                                                    <DropdownMenuButton
                                                        className="text-left flex flex-nowrap items-center"
                                                        onClick={() => openCustomExpirationModal(true)}
                                                        data-testid="message-view-more-dropdown:expire-30-days"
                                                    >
                                                        <Icon name="hourglass" className="mr-2" />
                                                        <span className="flex-1 my-auto">{c('Action')
                                                            .t`Self-destruct on ...`}</span>
                                                    </DropdownMenuButton>
                                                </>
                                            )}
                                        </>
                                    ) : null}

                                    <hr className="my-2" />

                                    <DropdownMenuButton
                                        className="text-left flex flex-nowrap items-center"
                                        onClick={handleExport}
                                        data-testid="message-view-more-dropdown:export"
                                    >
                                        <Icon name="arrow-up-from-square" className="mr-2" />
                                        <span className="flex-1 my-auto">{c('Action').t`Export`}</span>
                                    </DropdownMenuButton>
                                    <DropdownMenuButton
                                        className="text-left flex flex-nowrap items-center"
                                        onClick={() => setMessagePrintModalOpen(true)}
                                        data-testid="message-view-more-dropdown:print"
                                    >
                                        <Icon name="printer" className="mr-2" />
                                        <span className="flex-1 my-auto">{c('Action').t`Print`}</span>
                                    </DropdownMenuButton>

                                    <hr className="my-2" />

                                    <DropdownMenuButton
                                        className="text-left flex flex-nowrap items-center"
                                        onClick={() => setMessageDetailsModalOpen(true)}
                                        data-testid="message-view-more-dropdown:view-message-details"
                                    >
                                        <Icon name="list-bullets" className="mr-2" />
                                        <span className="flex-1 my-auto">{c('Action').t`View message details`}</span>
                                    </DropdownMenuButton>
                                    <DropdownMenuButton
                                        className="text-left flex flex-nowrap items-center"
                                        onClick={() => setMessageHeaderModalOpen(true)}
                                        data-testid="message-view-more-dropdown:view-message-headers"
                                    >
                                        <Icon name="window-terminal" className="mr-2" />
                                        <span className="flex-1 my-auto">{c('Action').t`View headers`}</span>
                                    </DropdownMenuButton>
                                    {!sourceMode && (
                                        <DropdownMenuButton
                                            className="text-left flex flex-nowrap items-center"
                                            onClick={() => onSourceMode(true)}
                                            data-testid="message-view-more-dropdown:view-html"
                                        >
                                            <Icon name="code" className="mr-2" />
                                            <span className="flex-1 my-auto">{c('Action').t`View HTML`}</span>
                                        </DropdownMenuButton>
                                    )}
                                    {sourceMode && (
                                        <DropdownMenuButton
                                            className="text-left flex flex-nowrap items-center"
                                            onClick={() => onSourceMode(false)}
                                            data-testid="message-view-more-dropdown:view-rendered-html"
                                        >
                                            <Icon name="window-image" className="mr-2" />
                                            <span className="flex-1 my-auto">{c('Action').t`View rendered HTML`}</span>
                                        </DropdownMenuButton>
                                    )}

                                    <hr className="my-2" />

                                    <DropdownMenuButton
                                        className="text-left flex flex-nowrap items-center color-danger"
                                        onClick={() => setMessagePhishingModalOpen(true)}
                                        data-testid="message-view-more-dropdown:report-phishing"
                                    >
                                        <Icon name="hook" className="mr-2 color-danger" />
                                        <span className="flex-1 my-auto color-danger">{c('Action')
                                            .t`Report phishing`}</span>
                                    </DropdownMenuButton>
                                </DropdownMenu>
                            );
                        },
                    }}
                </HeaderDropdown>
            </ButtonGroup>
            {renderMessageDetailsModal && (
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
            )}
            {renderMessageHeaderModal && <MessageHeadersModal message={message.data} {...messageHeaderModalProps} />}
            {renderPrintModal && (
                <MessagePrintModal
                    message={message as MessageStateWithData}
                    labelID={labelID}
                    {...messagePrintModalProps}
                />
            )}
            {renderMessagePhishingModal && (
                <MessagePhishingModal message={message} onBack={onBack} {...messagePhishingModalProps} />
            )}
            {renderMessagePermanentDeleteModal && (
                <MessagePermanentDeleteModal
                    message={message.data as MessageWithOptionalBody}
                    {...messagePermanentDeleteModalProps}
                />
            )}
            {moveScheduledModal}
            {moveSnoozedModal}
            {moveToSpamModal}
            {renderCustomExpirationModal && (
                <CustomExpirationModal onSubmit={handleCustomExpiration} {...CustomExpirationModalProps} />
            )}
        </>
    );
};

export default HeaderMoreDropdown;
