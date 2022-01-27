import { useRef } from 'react';
import { c } from 'ttag';
import { useLocation } from 'react-router-dom';

import {
    Icon,
    DropdownMenu,
    DropdownMenuButton,
    useApi,
    useEventManager,
    useNotifications,
    useModals,
    useFolders,
    ConfirmModal,
    ErrorButton,
    Alert,
    ButtonGroup,
    Button,
    Tooltip,
    useLabels,
    useMailSettings,
} from '@proton/components';
import { Message } from '@proton/shared/lib/interfaces/mail/Message';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { noop } from '@proton/shared/lib/helpers/function';
import downloadFile from '@proton/shared/lib/helpers/downloadFile';
import { reportPhishing } from '@proton/shared/lib/api/reports';
import { deleteMessages } from '@proton/shared/lib/api/messages';
import { MailSettings } from '@proton/shared/lib/interfaces';
import { useDispatch } from 'react-redux';
import { DecryptResultPmcrypto } from 'pmcrypto';
import MessageHeadersModal from '../modals/MessageHeadersModal';
import { getDate } from '../../../helpers/elements';
import { formatFileNameDate } from '../../../helpers/date';
import MessagePrintModal from '../modals/MessagePrintModal';
import { exportBlob } from '../../../helpers/message/messageExport';
import HeaderDropdown, { DropdownRender } from './HeaderDropdown';
import { useMoveToFolder } from '../../../hooks/useApplyLabels';
import { getFolderName, getCurrentFolderID } from '../../../helpers/labels';
import { useMarkAs, MARK_AS_STATUS } from '../../../hooks/useMarkAs';
import { Element } from '../../../models/element';
import { Breakpoints } from '../../../models/utils';
import CustomFilterDropdown from '../../dropdown/CustomFilterDropdown';
import MoveDropdown from '../../dropdown/MoveDropdown';
import LabelDropdown from '../../dropdown/LabelDropdown';
import { useGetMessageKeys } from '../../../hooks/message/useGetMessageKeys';
import { getDeleteTitle, getModalText, getNotificationText } from '../../../hooks/usePermanentDelete';
import { isConversationMode } from '../../../helpers/mailSettings';
import { updateAttachment } from '../../../logic/attachments/attachmentsActions';
import { useGetAttachment } from '../../../hooks/useAttachment';
import { MessageState, MessageStateWithData } from '../../../logic/messages/messagesTypes';

const { INBOX, TRASH, SPAM } = MAILBOX_LABEL_IDS;

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
}: Props) => {
    const location = useLocation();
    const api = useApi();
    const getAttachment = useGetAttachment();
    const dispatch = useDispatch();
    const { call } = useEventManager();
    const { createNotification } = useNotifications();
    const { createModal } = useModals();
    const closeDropdown = useRef<() => void>();
    const moveToFolder = useMoveToFolder();
    const [folders = []] = useFolders();
    const [labels = []] = useLabels();
    const markAs = useMarkAs();
    const getMessageKeys = useGetMessageKeys();
    const [{ Shortcuts = 0 } = {}] = useMailSettings();

    const handleMove = (folderID: string, fromFolderID: string) => async () => {
        closeDropdown.current?.();
        const folderName = getFolderName(folderID, folders);
        await moveToFolder([message.data || ({} as Element)], folderID, folderName, fromFolderID);
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

    // Reference: Angular/src/app/bugReport/factories/bugReportModel.js
    const handleConfirmPhishing = async () => {
        await api(
            reportPhishing({
                MessageID: message.data?.ID,
                MIMEType: message.data?.MIMEType === 'text/plain' ? 'text/plain' : 'text/html', // Accept only 'text/plain' / 'text/html'
                Body: message.decryption?.decryptedBody,
            })
        );

        await moveToFolder([message.data || ({} as Element)], SPAM, '', '', true);
        createNotification({ text: c('Success').t`Phishing reported` });
        onBack();
    };

    const handlePhishing = () => {
        createModal(
            <ConfirmModal title={c('Info').t`Confirm phishing report`} onConfirm={handleConfirmPhishing} onClose={noop}>
                <Alert className="mb1" type="warning">{c('Info')
                    .t`Reporting a message as a phishing attempt will send the message to us, so we can analyze it and improve our filters. This means that we will be able to see the contents of the message in full.`}</Alert>
            </ConfirmModal>
        );
    };

    const handleDelete = async () => {
        await new Promise((resolve, reject) => {
            createModal(
                <ConfirmModal
                    title={getDeleteTitle(false, false, 1)}
                    confirm={<ErrorButton type="submit">{c('Action').t`Delete`}</ErrorButton>}
                    onConfirm={() => resolve(undefined)}
                    onClose={reject}
                >
                    <Alert className="mb1" type="error">
                        {getModalText(false, false, 1)}
                    </Alert>
                </ConfirmModal>
            );
        });
        await api(deleteMessages([message.data?.ID]));
        await call();
        createNotification({ text: getNotificationText(false, false, 1) });
    };

    const handleHeaders = () => {
        createModal(<MessageHeadersModal message={message.data} />);
    };

    const onUpdateAttachment = (ID: string, attachment: DecryptResultPmcrypto) => {
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

    const handlePrint = async () => {
        createModal(<MessagePrintModal message={message as MessageStateWithData} labelID={labelID} />);
    };

    const messageLabelIDs = message.data?.LabelIDs || [];
    const selectedIDs = [message.data?.ID || ''];
    const isSpam = messageLabelIDs.includes(SPAM);
    const isInTrash = messageLabelIDs.includes(TRASH);
    const fromFolderID = getCurrentFolderID(messageLabelIDs, folders);
    const { isNarrow } = breakpoints;
    const additionalDropdowns: DropdownRender[] | undefined = isNarrow
        ? [
              ({ onClose }) => <CustomFilterDropdown message={message.data as Message} onClose={onClose} />,
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
                      labels={labels}
                      selectedIDs={selectedIDs}
                      onClose={onClose}
                      onLock={onLock}
                      breakpoints={breakpoints}
                  />
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

    return (
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
                        <Icon name="eye-slash" alt={c('Title').t`Mark as unread`} />
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
            <HeaderDropdown
                icon
                disabled={!messageLoaded}
                autoClose
                title={c('Title').t`More`}
                content={<Icon name="angle-down" className="caret-like" alt={c('Title').t`More options`} />}
                hasCaret={false}
                additionalDropdowns={additionalDropdowns}
                data-testid="message-header-expanded:more-dropdown"
            >
                {({ onClose, onOpenAdditionnal }) => {
                    closeDropdown.current = onClose;
                    return (
                        <DropdownMenu>
                            {isNarrow && (
                                <DropdownMenuButton
                                    className="text-left flex flex-nowrap"
                                    onClick={() => onOpenAdditionnal(0)}
                                >
                                    <Icon name="filter" className="mr0-5 mt0-25" />
                                    <span className="flex-item-fluid mtauto mbauto">{c('Action').t`Filter on...`}</span>
                                </DropdownMenuButton>
                            )}
                            {isNarrow && (
                                <DropdownMenuButton
                                    className="text-left flex flex-nowrap"
                                    onClick={() => onOpenAdditionnal(1)}
                                >
                                    <Icon name="folder" className="mr0-5 mt0-25" />
                                    <span className="flex-item-fluid mtauto mbauto">{c('Action').t`Move to...`}</span>
                                </DropdownMenuButton>
                            )}
                            {isNarrow && (
                                <DropdownMenuButton
                                    className="text-left flex flex-nowrap"
                                    onClick={() => onOpenAdditionnal(2)}
                                >
                                    <Icon name="tag" className="mr0-5 mt0-25" />
                                    <span className="flex-item-fluid mtauto mbauto">{c('Action').t`Label as...`}</span>
                                </DropdownMenuButton>
                            )}
                            {isSpam ? (
                                <DropdownMenuButton className="text-left flex flex-nowrap" onClick={handleUnread}>
                                    <Icon name="eye-slash" className="mr0-5 mt0-25" />
                                    <span className="flex-item-fluid mtauto mbauto">{c('Action')
                                        .t`Mark as unread`}</span>
                                </DropdownMenuButton>
                            ) : (
                                <DropdownMenuButton
                                    className="text-left flex flex-nowrap"
                                    onClick={handleMove(SPAM, fromFolderID)}
                                >
                                    <Icon name="fire" className="mr0-5 mt0-25" />
                                    <span className="flex-item-fluid mtauto mbauto">{c('Action').t`Move to spam`}</span>
                                </DropdownMenuButton>
                            )}
                            {isInTrash ? (
                                <DropdownMenuButton className="text-left flex flex-nowrap" onClick={handleDelete}>
                                    <Icon name="circle-xmark" className="mr0-5 mt0-25" />
                                    <span className="flex-item-fluid mtauto mbauto">{c('Action').t`Delete`}</span>
                                </DropdownMenuButton>
                            ) : null}
                            <DropdownMenuButton className="text-left flex flex-nowrap" onClick={handlePhishing}>
                                <Icon name="hook" className="mr0-5 mt0-25" />
                                <span className="flex-item-fluid mtauto mbauto">{c('Action').t`Report phishing`}</span>
                            </DropdownMenuButton>
                            {!sourceMode && (
                                <DropdownMenuButton
                                    className="text-left flex flex-nowrap"
                                    onClick={() => onSourceMode(true)}
                                >
                                    <Icon name="code" className="mr0-5 mt0-25" />
                                    <span className="flex-item-fluid mtauto mbauto">{c('Action')
                                        .t`View source code`}</span>
                                </DropdownMenuButton>
                            )}
                            {sourceMode && (
                                <DropdownMenuButton
                                    className="text-left flex flex-nowrap"
                                    onClick={() => onSourceMode(false)}
                                >
                                    <Icon name="window-image" className="mr0-5 mt0-25" />
                                    <span className="flex-item-fluid mtauto mbauto">{c('Action')
                                        .t`View rendered HTML`}</span>
                                </DropdownMenuButton>
                            )}
                            <DropdownMenuButton className="text-left flex flex-nowrap" onClick={handleHeaders}>
                                <Icon name="window-terminal" className="mr0-5 mt0-25" />
                                <span className="flex-item-fluid mtauto mbauto">{c('Action').t`View headers`}</span>
                            </DropdownMenuButton>
                            <DropdownMenuButton className="text-left flex flex-nowrap" onClick={handleExport}>
                                <Icon name="arrow-up-from-screen" className="mr0-5 mt0-25" />
                                <span className="flex-item-fluid mtauto mbauto">{c('Action').t`Export`}</span>
                            </DropdownMenuButton>
                            <DropdownMenuButton className="text-left flex flex-nowrap" onClick={handlePrint}>
                                <Icon name="printer" className="mr0-5 mt0-25" />
                                <span className="flex-item-fluid mtauto mbauto">{c('Action').t`Print`}</span>
                            </DropdownMenuButton>
                        </DropdownMenu>
                    );
                }}
            </HeaderDropdown>
        </ButtonGroup>
    );
};

export default HeaderMoreDropdown;
