import React from 'react';
import { c } from 'ttag';
import {
    Icon,
    DropdownMenu,
    DropdownMenuButton,
    useApi,
    useEventManager,
    useNotifications,
    useModals,
    ConfirmModal,
    Alert
} from 'react-components';
import { labelMessages, markMessageAsUnread } from 'proton-shared/lib/api/messages';
import { MAILBOX_LABEL_IDS } from 'proton-shared/lib/constants';
import { noop } from 'proton-shared/lib/helpers/function';

import { MessageExtended } from '../../../models/message';
import MessageHeadersModal from '../modals/MessageHeadersModal';
import { reportPhishing } from 'proton-shared/lib/api/reports';
import { useAttachmentCache } from '../../../containers/AttachmentProvider';
import { getTime } from '../../../helpers/elements';
import { formatFileNameDate } from '../../../helpers/date';
import downloadFile from 'proton-shared/lib/helpers/downloadFile';
import MessagePrintModal from '../modals/MessagePrintModal';
import { exportBlob } from '../../../helpers/message/messageExport';

interface Props {
    message: MessageExtended;
    sourceMode: boolean;
    onClose: () => void;
    onBack: () => void;
    onCollapse: () => void;
    onSourceMode: (sourceMode: boolean) => void;
}

const HeaderMoreDropdown = ({ message, sourceMode, onClose, onBack, onCollapse, onSourceMode }: Props) => {
    const api = useApi();
    const attachmentsCache = useAttachmentCache();
    const { call } = useEventManager();
    const { createNotification } = useNotifications();
    const { createModal } = useModals();

    // Don't bother too much on this
    // A better / generic action is coming in feat/sub-folders
    const handleMove = (labelID: string) => async () => {
        onClose();
        await api(labelMessages({ LabelID: labelID, IDs: [message.data?.ID] }));
        await call();
        createNotification({ text: c('Success').t`Message moved` });
    };

    const handleUnread = async () => {
        onClose();
        await api(markMessageAsUnread([message.data?.ID]));
        await call();
        onCollapse();
    };

    // Reference: Angular/src/app/bugReport/factories/bugReportModel.js
    const handleConfirmPhishing = async () => {
        await api(
            reportPhishing({
                MessageID: message.data?.ID,
                MIMEType: message.data?.MIMEType === 'text/plain' ? 'text/plain' : 'text/html', // Accept only 'text/plain' / 'text/html'
                Body: message.decryptedBody
            })
        );
        await api(labelMessages({ LabelID: MAILBOX_LABEL_IDS.SPAM, IDs: [message.data?.ID] }));
        await call();
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
        const { Subject = '' } = message.data || {};
        const time = formatFileNameDate(new Date(getTime(message.data || {}, '')));
        const blob = await exportBlob(message, attachmentsCache, api);
        const filename = `${Subject} ${time}.eml`;
        downloadFile(blob, filename);
    };

    const handlePrint = async () => {
        createModal(<MessagePrintModal message={message} />);
    };

    const messageLabelIDs = message.data?.LabelIDs || [];
    const isSpam = messageLabelIDs.indexOf(MAILBOX_LABEL_IDS.SPAM) > -1;
    const isInInbox = messageLabelIDs.indexOf(MAILBOX_LABEL_IDS.INBOX) > -1;
    const isInTrash = messageLabelIDs.indexOf(MAILBOX_LABEL_IDS.TRASH) > -1;

    return (
        <DropdownMenu>
            {!isInInbox && (
                <DropdownMenuButton
                    className="alignleft flex flex-nowrap flex-nowrap"
                    onClick={handleMove(MAILBOX_LABEL_IDS.INBOX)}
                >
                    <Icon name="inbox" className="mr0-5 mt0-25" />
                    <span className="flex-item-fluid mtauto mbauto">{c('Action').t`Move to inbox`}</span>
                </DropdownMenuButton>
            )}
            {!isInTrash && (
                <DropdownMenuButton
                    className="alignleft flex flex-nowrap"
                    onClick={handleMove(MAILBOX_LABEL_IDS.TRASH)}
                >
                    <Icon name="trash" className="mr0-5 mt0-25" />
                    <span className="flex-item-fluid mtauto mbauto">{c('Action').t`Move to trash`}</span>
                </DropdownMenuButton>
            )}
            <DropdownMenuButton className="alignleft flex flex-nowrap" onClick={handleUnread}>
                <Icon name="unread" className="mr0-5 mt0-25" />
                <span className="flex-item-fluid mtauto mbauto">{c('Action').t`Mark as unread`}</span>
            </DropdownMenuButton>
            {isSpam ? (
                <DropdownMenuButton
                    className="alignleft flex flex-nowrap"
                    onClick={handleMove(MAILBOX_LABEL_IDS.INBOX)}
                >
                    <Icon name="nospam" className="mr0-5 mt0-25" />
                    <span className="flex-item-fluid mtauto mbauto">{c('Action').t`Not a spam`}</span>
                </DropdownMenuButton>
            ) : (
                <DropdownMenuButton className="alignleft flex flex-nowrap" onClick={handleMove(MAILBOX_LABEL_IDS.SPAM)}>
                    <Icon name="spam" className="mr0-5 mt0-25" />
                    <span className="flex-item-fluid mtauto mbauto">{c('Action').t`Mark as spam`}</span>
                </DropdownMenuButton>
            )}
            <DropdownMenuButton className="alignleft flex flex-nowrap" onClick={handlePhishing}>
                <Icon name="phishing" className="mr0-5 mt0-25" />
                <span className="flex-item-fluid mtauto mbauto">{c('Action').t`Report phishing`}</span>
            </DropdownMenuButton>
            {!sourceMode && (
                <DropdownMenuButton className="alignleft flex flex-nowrap" onClick={() => onSourceMode(true)}>
                    <Icon name="view-source-code" className="mr0-5 mt0-25" />
                    <span className="flex-item-fluid mtauto mbauto">{c('Action').t`View source code`}</span>
                </DropdownMenuButton>
            )}
            {sourceMode && (
                <DropdownMenuButton className="alignleft flex flex-nowrap" onClick={() => onSourceMode(false)}>
                    <Icon name="view-html-code" className="mr0-5 mt0-25" />
                    <span className="flex-item-fluid mtauto mbauto">{c('Action').t`View rendered HTML`}</span>
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
};

export default HeaderMoreDropdown;
