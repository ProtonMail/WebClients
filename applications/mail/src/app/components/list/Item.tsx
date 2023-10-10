import { ChangeEvent, DragEvent, MouseEvent, memo, useMemo, useRef } from 'react';

import { ItemCheckbox, useLabels, useMailSettings } from '@proton/components';
import { MAILBOX_LABEL_IDS, VIEW_MODE } from '@proton/shared/lib/constants';
import { Message } from '@proton/shared/lib/interfaces/mail/Message';
import { getRecipients as getMessageRecipients, getSender, isDraft, isSent } from '@proton/shared/lib/mail/messages';
import clsx from '@proton/utils/clsx';

import { filterAttachmentToPreview } from 'proton-mail/helpers/attachment/attachmentThumbnails';

import { useEncryptedSearchContext } from '../../containers/EncryptedSearchProvider';
import { getRecipients as getConversationRecipients, getSenders } from '../../helpers/conversation';
import { isMessage, isUnread } from '../../helpers/elements';
import { isCustomLabel } from '../../helpers/labels';
import { useRecipientLabel } from '../../hooks/contact/useRecipientLabel';
import { Element } from '../../models/element';
import { ESMessage } from '../../models/encryptedSearch';
import { Breakpoints } from '../../models/utils';
import ItemColumnLayout from './ItemColumnLayout';
import ItemRowLayout from './ItemRowLayout';
import ItemSenders from './ItemSenders';

const { SENT, ALL_SENT, ALL_MAIL, ALMOST_ALL_MAIL, STARRED, DRAFTS, ALL_DRAFTS, SCHEDULED } = MAILBOX_LABEL_IDS;

const labelsWithIcons = [ALL_MAIL, ALMOST_ALL_MAIL, STARRED, ALL_SENT, ALL_DRAFTS] as string[];

interface Props {
    conversationMode: boolean;
    isCompactView: boolean;
    labelID: string;
    loading: boolean;
    elementID?: string;
    columnLayout: boolean;
    element: Element;
    checked?: boolean;
    onCheck: (event: ChangeEvent, elementID: string) => void;
    onClick: (elementID: string | undefined) => void;
    onContextMenu: (event: React.MouseEvent<HTMLDivElement>, element: Element) => void;
    onDragStart: (event: DragEvent, element: Element) => void;
    onDragEnd: (event: DragEvent) => void;
    onBack: () => void;
    dragged: boolean;
    index: number;
    breakpoints: Breakpoints;
    onFocus: (index: number) => void;
}

const Item = ({
    conversationMode,
    isCompactView,
    labelID,
    loading,
    element,
    elementID,
    columnLayout,
    checked = false,
    onCheck,
    onClick,
    onContextMenu,
    onDragStart,
    onDragEnd,
    onBack,
    dragged,
    index,
    breakpoints,
    onFocus,
}: Props) => {
    const [mailSettings] = useMailSettings();
    const [labels] = useLabels();
    const { shouldHighlight, esStatus } = useEncryptedSearchContext();
    const { dbExists, esEnabled, contentIndexingDone } = esStatus;

    const useContentSearch =
        dbExists && esEnabled && shouldHighlight() && contentIndexingDone && !!(element as ESMessage)?.decryptedBody;

    const elementRef = useRef<HTMLDivElement>(null);

    const displayRecipients =
        [SENT, ALL_SENT, DRAFTS, ALL_DRAFTS, SCHEDULED].includes(labelID as MAILBOX_LABEL_IDS) ||
        isSent(element) ||
        isDraft(element);
    const { getRecipientLabel, getRecipientsOrGroups, getRecipientsOrGroupsLabels } = useRecipientLabel();
    const isConversationContentView = mailSettings?.ViewMode === VIEW_MODE.GROUP;
    const isSelected =
        isConversationContentView && isMessage(element)
            ? elementID === (element as Message).ConversationID
            : elementID === element.ID;
    const showIcon = labelsWithIcons.includes(labelID) || isCustomLabel(labelID, labels);
    const senders = conversationMode
        ? getSenders(element)
        : getSender(element as Message)
        ? [getSender(element as Message)]
        : [];
    const recipients = conversationMode ? getConversationRecipients(element) : getMessageRecipients(element as Message);
    const sendersLabels = useMemo(() => senders.map((sender) => getRecipientLabel(sender, true)), [senders]);
    const recipientsOrGroup = getRecipientsOrGroups(recipients);
    const recipientsLabels = getRecipientsOrGroupsLabels(recipientsOrGroup);

    const ItemLayout = columnLayout ? ItemColumnLayout : ItemRowLayout;
    const unread = isUnread(element, labelID);
    const firstRecipients = displayRecipients ? recipients : senders;
    // Warning, spreading firstRecipients on Safari preview cause crash
    // See MAILWEB-4079
    const firstRecipient = firstRecipients[0];

    const filteredThumbnails = filterAttachmentToPreview(element.AttachmentsMetadata || []);

    const handleClick = (event: MouseEvent<HTMLDivElement>) => {
        const target = event.target as HTMLElement;
        if (target.closest('.stop-propagation')) {
            event.stopPropagation();
            return;
        }
        onClick(element.ID);
    };

    const handleCheck = (event: ChangeEvent) => {
        onCheck(event, element.ID || '');
    };

    const handleFocus = () => {
        onFocus(index);
    };

    const senderItem = (
        <ItemSenders
            element={element}
            conversationMode={conversationMode}
            loading={loading}
            unread={unread}
            displayRecipients={displayRecipients}
            isSelected={isSelected}
        />
    );

    return (
        <div
            className={clsx(
                'item-container-wrapper relative',
                (isCompactView || !columnLayout) && 'border-bottom border-weak'
            )}
        >
            <div
                onContextMenu={(event) => onContextMenu(event, element)}
                onClick={handleClick}
                draggable
                onDragStart={(event) => onDragStart(event, element)}
                onDragEnd={onDragEnd}
                className={clsx([
                    'flex-item-fluid flex flex-nowrap cursor-pointer opacity-on-hover-container',
                    columnLayout ? 'item-container item-container-column' : 'item-container-row',
                    isSelected && 'item-is-selected',
                    !unread && 'read',
                    unread && 'unread',
                    dragged && 'item-dragging',
                    loading && 'item-is-loading',
                    useContentSearch && columnLayout && 'es-three-rows',
                    useContentSearch && !columnLayout && 'es-row-results',
                ])}
                style={{ '--index': index }}
                ref={elementRef}
                onFocus={handleFocus}
                tabIndex={0}
                data-element-id={element.ID}
                data-shortcut-target="item-container"
                data-shortcut-target-selected={isSelected}
                data-testid={`message-item:${element.Subject}`}
                data-testorder={element.Order}
            >
                <ItemCheckbox
                    ID={element.ID}
                    bimiSelector={firstRecipient?.BimiSelector || undefined}
                    name={displayRecipients ? recipientsLabels[0] : sendersLabels[0]}
                    email={firstRecipient?.Address}
                    displaySenderImage={!!firstRecipient?.DisplaySenderImage}
                    checked={checked}
                    onChange={handleCheck}
                    compactClassName="mr-3 stop-propagation"
                    normalClassName={clsx(['ml-0.5', columnLayout ? 'mr-2 mt-0.5' : 'mr-2'])}
                />
                <ItemLayout
                    isCompactView={isCompactView}
                    labelID={labelID}
                    elementID={elementID}
                    labels={labels}
                    element={element}
                    conversationMode={conversationMode}
                    showIcon={showIcon}
                    senders={senderItem}
                    unread={unread}
                    breakpoints={breakpoints}
                    onBack={onBack}
                    isSelected={isSelected}
                    attachmentsMetadata={filteredThumbnails}
                />
            </div>
        </div>
    );
};

export default memo(Item);
