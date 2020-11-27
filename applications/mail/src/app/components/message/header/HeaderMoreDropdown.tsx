import { Message } from 'proton-shared/lib/interfaces/mail/Message';
import React, { useRef } from 'react';
import { c } from 'ttag';
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
    Alert,
    Group,
    ButtonGroup,
    Tooltip,
    useLabels,
} from 'react-components';
import { MAILBOX_LABEL_IDS } from 'proton-shared/lib/constants';
import { noop } from 'proton-shared/lib/helpers/function';
import downloadFile from 'proton-shared/lib/helpers/downloadFile';
import { reportPhishing } from 'proton-shared/lib/api/reports';

import { MessageExtended, MessageExtendedWithData } from '../../../models/message';
import MessageHeadersModal from '../modals/MessageHeadersModal';
import { useAttachmentCache } from '../../../containers/AttachmentProvider';
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

const { INBOX, TRASH, SPAM } = MAILBOX_LABEL_IDS;

interface Props {
    labelID: string;
    message: MessageExtended;
    messageLoaded: boolean;
    sourceMode: boolean;
    onBack: () => void;
    onCollapse: () => void;
    onSourceMode: (sourceMode: boolean) => void;
    breakpoints: Breakpoints;
}

const HeaderMoreDropdown = ({
    labelID,
    message,
    messageLoaded,
    sourceMode,
    onBack,
    onCollapse,
    onSourceMode,
    breakpoints,
}: Props) => {
    const api = useApi();
    const attachmentsCache = useAttachmentCache();
    const { call } = useEventManager();
    const { createNotification } = useNotifications();
    const { createModal } = useModals();
    const closeDropdown = useRef<() => void>();
    const moveToFolder = useMoveToFolder();
    const [folders = []] = useFolders();
    const [labels = []] = useLabels();
    const markAs = useMarkAs();
    const getMessageKeys = useGetMessageKeys();

    const handleMove = (folderID: string, fromFolderID: string) => async () => {
        closeDropdown.current?.();
        const folderName = getFolderName(folderID, folders);
        await moveToFolder([message.data || {}], folderID, folderName, fromFolderID);
    };

    const handleUnread = async () => {
        closeDropdown.current?.();
        onCollapse();
        await markAs([message.data as Element], labelID, MARK_AS_STATUS.UNREAD);
        await call();
    };

    // Reference: Angular/src/app/bugReport/factories/bugReportModel.js
    const handleConfirmPhishing = async () => {
        await api(
            reportPhishing({
                MessageID: message.data?.ID,
                MIMEType: message.data?.MIMEType === 'text/plain' ? 'text/plain' : 'text/html', // Accept only 'text/plain' / 'text/html'
                Body: message.decryptedBody,
            })
        );

        await moveToFolder([message.data || {}], SPAM, '', '', true);
        createNotification({ text: c('Success').t`Phishing reported` });
        onBack();
    };

    const handlePhishing = () => {
        createModal(
            <ConfirmModal title={c('Info').t`Confirm phishing report`} onConfirm={handleConfirmPhishing} onClose={noop}>
                <Alert type="warning">{c('Info')
                    .t`Reporting a message as a phishing attempt will send the message to us, so we can analyze it and improve our filters. This means that we will be able to see the contents of the message in full.`}</Alert>
            </ConfirmModal>
        );
    };

    const handleHeaders = () => {
        createModal(<MessageHeadersModal message={message.data} />);
    };

    const handleExport = async () => {
        // Angular/src/app/message/directives/actionMessage.js
        const messageKeys = await getMessageKeys(message.data as Message);
        const { Subject = '' } = message.data || {};
        const time = formatFileNameDate(getDate(message.data, labelID));
        const blob = await exportBlob(message, messageKeys, attachmentsCache, api);
        const filename = `${Subject} ${time}.eml`;
        downloadFile(blob, filename);
    };

    const handlePrint = async () => {
        createModal(<MessagePrintModal message={message as MessageExtendedWithData} labelID={labelID} />);
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

    return (
        <Group className="mr1 mb0-5">
            {isSpam ? (
                <ButtonGroup
                    disabled={!messageLoaded}
                    onClick={handleMove(INBOX, SPAM)}
                    className="pm-button--for-icon relative"
                >
                    <Tooltip title={c('Title').t`Move to inbox (not spam)`} className="flex increase-surface-click">
                        <Icon name="nospam" alt={c('Title').t`Move to inbox (not spam)`} />
                    </Tooltip>
                </ButtonGroup>
            ) : (
                <ButtonGroup disabled={!messageLoaded} onClick={handleUnread} className="pm-button--for-icon relative">
                    <Tooltip title={c('Title').t`Mark as unread`} className="flex increase-surface-click">
                        <Icon name="unread" alt={c('Title').t`Mark as unread`} />
                    </Tooltip>
                </ButtonGroup>
            )}
            {isInTrash ? (
                <ButtonGroup
                    disabled={!messageLoaded}
                    onClick={handleMove(INBOX, TRASH)}
                    className="pm-button--for-icon relative"
                >
                    <Tooltip title={c('Title').t`Move to inbox`} className="flex increase-surface-click">
                        <Icon name="inbox" alt={c('Title').t`Move to inbox`} />
                    </Tooltip>
                </ButtonGroup>
            ) : (
                <ButtonGroup
                    disabled={!messageLoaded}
                    onClick={handleMove(TRASH, fromFolderID)}
                    className="pm-button--for-icon relative"
                >
                    <Tooltip title={c('Title').t`Move to trash`} className="flex increase-surface-click">
                        <Icon name="trash" alt={c('Title').t`Move to trash`} />
                    </Tooltip>
                </ButtonGroup>
            )}

            <HeaderDropdown
                disabled={!messageLoaded}
                className="pm-button pm-button--for-icon pm-group-button"
                autoClose
                title={c('Title').t`More`}
                content={<Icon name="caret" className="caret-like" alt={c('Title').t`More options`} />}
                hasCaret={false}
                additionalDropdowns={additionalDropdowns}
            >
                {({ onClose, onOpenAdditionnal }) => {
                    closeDropdown.current = onClose;
                    return (
                        <DropdownMenu>
                            {isNarrow && (
                                <DropdownMenuButton
                                    className="alignleft flex flex-nowrap"
                                    onClick={() => onOpenAdditionnal(0)}
                                >
                                    <Icon name="filter" className="mr0-5 mt0-25" />
                                    <span className="flex-item-fluid mtauto mbauto">{c('Action').t`Filter on...`}</span>
                                </DropdownMenuButton>
                            )}
                            {isNarrow && (
                                <DropdownMenuButton
                                    className="alignleft flex flex-nowrap"
                                    onClick={() => onOpenAdditionnal(1)}
                                >
                                    <Icon name="folder" className="mr0-5 mt0-25" />
                                    <span className="flex-item-fluid mtauto mbauto">{c('Action').t`Move to...`}</span>
                                </DropdownMenuButton>
                            )}
                            {isNarrow && (
                                <DropdownMenuButton
                                    className="alignleft flex flex-nowrap"
                                    onClick={() => onOpenAdditionnal(2)}
                                >
                                    <Icon name="label" className="mr0-5 mt0-25" />
                                    <span className="flex-item-fluid mtauto mbauto">{c('Action').t`Label as...`}</span>
                                </DropdownMenuButton>
                            )}
                            {isSpam ? (
                                <DropdownMenuButton className="alignleft flex flex-nowrap" onClick={handleUnread}>
                                    <Icon name="unread" className="mr0-5 mt0-25" />
                                    <span className="flex-item-fluid mtauto mbauto">{c('Action')
                                        .t`Mark as unread`}</span>
                                </DropdownMenuButton>
                            ) : (
                                <DropdownMenuButton
                                    className="alignleft flex flex-nowrap"
                                    onClick={handleMove(SPAM, fromFolderID)}
                                >
                                    <Icon name="spam" className="mr0-5 mt0-25" />
                                    <span className="flex-item-fluid mtauto mbauto">{c('Action').t`Move to spam`}</span>
                                </DropdownMenuButton>
                            )}
                            <DropdownMenuButton className="alignleft flex flex-nowrap" onClick={handlePhishing}>
                                <Icon name="phishing" className="mr0-5 mt0-25" />
                                <span className="flex-item-fluid mtauto mbauto">{c('Action').t`Report phishing`}</span>
                            </DropdownMenuButton>
                            {!sourceMode && (
                                <DropdownMenuButton
                                    className="alignleft flex flex-nowrap"
                                    onClick={() => onSourceMode(true)}
                                >
                                    <Icon name="view-source-code" className="mr0-5 mt0-25" />
                                    <span className="flex-item-fluid mtauto mbauto">{c('Action')
                                        .t`View source code`}</span>
                                </DropdownMenuButton>
                            )}
                            {sourceMode && (
                                <DropdownMenuButton
                                    className="alignleft flex flex-nowrap"
                                    onClick={() => onSourceMode(false)}
                                >
                                    <Icon name="view-html-code" className="mr0-5 mt0-25" />
                                    <span className="flex-item-fluid mtauto mbauto">{c('Action')
                                        .t`View rendered HTML`}</span>
                                </DropdownMenuButton>
                            )}
                            <DropdownMenuButton className="alignleft flex flex-nowrap" onClick={handleHeaders}>
                                <Icon name="view-headers" className="mr0-5 mt0-25" />
                                <span className="flex-item-fluid mtauto mbauto">{c('Action').t`View headers`}</span>
                            </DropdownMenuButton>
                            <DropdownMenuButton className="alignleft flex flex-nowrap" onClick={handleExport}>
                                <Icon name="export" className="mr0-5 mt0-25" />
                                <span className="flex-item-fluid mtauto mbauto">{c('Action').t`Export`}</span>
                            </DropdownMenuButton>
                            <DropdownMenuButton className="alignleft flex flex-nowrap" onClick={handlePrint}>
                                <Icon name="print" className="mr0-5 mt0-25" />
                                <span className="flex-item-fluid mtauto mbauto">{c('Action').t`Print`}</span>
                            </DropdownMenuButton>
                        </DropdownMenu>
                    );
                }}
            </HeaderDropdown>
        </Group>
    );
};

export default HeaderMoreDropdown;
