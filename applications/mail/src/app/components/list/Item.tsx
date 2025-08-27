import type { ChangeEvent, DragEvent, MouseEvent } from 'react';
import { memo, useMemo, useRef } from 'react';

import { ItemCheckbox } from '@proton/components';
import { isCustomLabel } from '@proton/mail/helpers/location';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { toValidHtmlId } from '@proton/shared/lib/dom/toValidHtmlId';
import type { Label, MailSettings, UserSettings } from '@proton/shared/lib/interfaces';
import type { Message } from '@proton/shared/lib/interfaces/mail/Message';
import { VIEW_MODE } from '@proton/shared/lib/mail/mailSettings';
import { getRecipients as getMessageRecipients, getSender, isDraft, isSent } from '@proton/shared/lib/mail/messages';
import clsx from '@proton/utils/clsx';

import { filterAttachmentToPreview } from 'proton-mail/helpers/attachment/attachmentThumbnails';
import { useMailSelector } from 'proton-mail/store/hooks';

import { useEncryptedSearchContext } from '../../containers/EncryptedSearchProvider';
import { getRecipients as getConversationRecipients, getSenders } from '../../helpers/conversation';
import { isElementMessage, isUnread } from '../../helpers/elements';
import { useRecipientLabel } from '../../hooks/contact/useRecipientLabel';
import type { Element } from '../../models/element';
import type { ESMessage } from '../../models/encryptedSearch';
import { selectSnoozeDropdownState } from '../../store/snooze/snoozeSliceSelectors';
import ItemColumnLayout from './ItemColumnLayout';
import ItemRowLayout from './ItemRowLayout';
import ItemSenders from './ItemSenders';

import './delight/DelightItem.scss';

const labelsWithIcons = [
    MAILBOX_LABEL_IDS.ALL_MAIL,
    MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
    MAILBOX_LABEL_IDS.STARRED,
    MAILBOX_LABEL_IDS.ALL_SENT,
    MAILBOX_LABEL_IDS.ALL_DRAFTS,
] as string[];

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
    onFocus: (elementID: string) => void;
    userSettings: UserSettings;
    mailSettings: MailSettings;
    labels?: Label[];
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
    onFocus,
    mailSettings,
    userSettings,
    labels,
}: Props) => {
    const { shouldHighlight, esStatus } = useEncryptedSearchContext();
    const { dbExists, esEnabled, contentIndexingDone } = esStatus;

    const useContentSearch =
        dbExists && esEnabled && shouldHighlight() && contentIndexingDone && !!(element as ESMessage)?.decryptedBody;
    const snoozeDropdownState = useMailSelector(selectSnoozeDropdownState);

    const elementRef = useRef<HTMLDivElement>(null);

    const displayRecipients =
        [
            MAILBOX_LABEL_IDS.SENT,
            MAILBOX_LABEL_IDS.ALL_SENT,
            MAILBOX_LABEL_IDS.DRAFTS,
            MAILBOX_LABEL_IDS.ALL_DRAFTS,
            MAILBOX_LABEL_IDS.SCHEDULED,
        ].includes(labelID as MAILBOX_LABEL_IDS) ||
        isSent(element) ||
        isDraft(element);
    const { getRecipientLabel, getRecipientsOrGroups, getRecipientsOrGroupsLabels } = useRecipientLabel();
    const isConversationContentView = mailSettings.ViewMode === VIEW_MODE.GROUP;
    const isSelected =
        isConversationContentView && isElementMessage(element)
            ? elementID === element.ConversationID
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

        if (target.closest('.stop-propagation') || snoozeDropdownState === 'open') {
            event.stopPropagation();
            return;
        }
        onClick(element.ID);
    };

    const handleCheck = (event: ChangeEvent) => {
        onCheck(event, element.ID || '');
    };

    const handleFocus = () => {
        onFocus(element.ID);
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
        <div className="item-container-wrapper relative" data-shortcut-target="item-container-wrapper">
            {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions, jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/prefer-tag-over-role */}
            <div
                onContextMenu={(event) => onContextMenu(event, element)}
                onClick={handleClick}
                draggable
                onDragStart={(event) => onDragStart(event, element)}
                onDragEnd={onDragEnd}
                className={clsx([
                    'relative flex-1 flex flex-nowrap cursor-pointer border-bottom border-top border-weak outline-none--at-all',
                    columnLayout ? 'item-container item-container--column' : 'item-container item-container--row',
                    isSelected && 'item-is-selected',
                    !unread && 'read',
                    unread && 'unread',
                    dragged && 'item-dragging',
                    useContentSearch && columnLayout && 'es-three-rows',
                    useContentSearch && !columnLayout && 'es-row-results',
                ])}
                style={{ '--index': index }}
                ref={elementRef}
                onFocus={handleFocus}
                // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
                tabIndex={0}
                data-element-id={element.ID}
                data-shortcut-target="item-container"
                data-shortcut-target-selected={isSelected}
                data-testid={`message-item:${element.Subject}`}
                data-testorder={element.Order}
                role="region"
                aria-labelledby={toValidHtmlId(`message-subject-${element.ID}`)}
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
                    normalClassName="mr-3"
                    variant="small"
                />
                <ItemLayout
                    isCompactView={isCompactView}
                    labelID={labelID}
                    loading={loading}
                    elementID={elementID}
                    labels={labels}
                    element={element}
                    conversationMode={conversationMode}
                    showIcon={showIcon}
                    senders={senderItem}
                    unread={unread}
                    onBack={onBack}
                    isSelected={isSelected}
                    attachmentsMetadata={filteredThumbnails}
                    userSettings={userSettings}
                />
            </div>
        </div>
    );
};

export default memo(Item);
