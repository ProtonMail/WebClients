import { ChangeEvent, DragEvent, MouseEvent, memo, useMemo, useRef, useState } from 'react';

import { ItemCheckbox, classnames, useLabels, useMailSettings } from '@proton/components';
import { MAILBOX_LABEL_IDS, VIEW_MODE } from '@proton/shared/lib/constants';
import { Message } from '@proton/shared/lib/interfaces/mail/Message';
import { getRecipients as getMessageRecipients, getSender, isDraft, isSent } from '@proton/shared/lib/mail/messages';

import { useEncryptedSearchContext } from '../../containers/EncryptedSearchProvider';
import { getRecipients as getConversationRecipients, getSenders } from '../../helpers/conversation';
import { isMessage, isUnread } from '../../helpers/elements';
import { isCustomLabel } from '../../helpers/labels';
import { useRecipientLabel } from '../../hooks/contact/useRecipientLabel';
import { Element } from '../../models/element';
import { Breakpoints } from '../../models/utils';
import ItemColumnLayout from './ItemColumnLayout';
import ItemRowLayout from './ItemRowLayout';

const { SENT, ALL_SENT, ALL_MAIL, STARRED, DRAFTS, ALL_DRAFTS, SCHEDULED } = MAILBOX_LABEL_IDS;

const labelsWithIcons = [ALL_MAIL, STARRED, ALL_SENT, ALL_DRAFTS] as string[];

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

    const { shouldHighlight, getESDBStatus } = useEncryptedSearchContext();
    const { dbExists, esEnabled } = getESDBStatus();
    const useES = dbExists && esEnabled && shouldHighlight();

    const elementRef = useRef<HTMLDivElement>(null);

    const [hasFocus, setHasFocus] = useState(false);

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
    const sendersAddresses = senders.map((sender) => sender?.Address);
    const recipientsOrGroup = getRecipientsOrGroups(recipients);
    const recipientsLabels = getRecipientsOrGroupsLabels(recipientsOrGroup);
    const recipientsAddresses = recipientsOrGroup
        .map(({ recipient, group }) =>
            recipient ? recipient.Address : group?.recipients.map((recipient) => recipient.Address)
        )
        .flat();

    const ItemLayout = columnLayout ? ItemColumnLayout : ItemRowLayout;
    const unread = isUnread(element, labelID);

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
        setHasFocus(true);
        onFocus(index);
    };

    const handleBlur = () => {
        setHasFocus(false);
    };

    return (
        <div className={classnames(['item-container-wrapper relative', !unread && 'read'])}>
            <div
                onContextMenu={(event) => onContextMenu(event, element)}
                onClick={handleClick}
                draggable
                onDragStart={(event) => onDragStart(event, element)}
                onDragEnd={onDragEnd}
                className={classnames([
                    'flex-item-fluid flex flex-nowrap cursor-pointer opacity-on-hover-container',
                    columnLayout ? 'item-container' : 'item-container-row flex-align-items-center',
                    isSelected && 'item-is-selected',
                    !unread && 'read',
                    unread && 'unread',
                    dragged && 'item-dragging',
                    loading && 'item-is-loading',
                    hasFocus && 'item-is-focused',
                    useES && columnLayout && 'es-three-rows',
                    useES && !columnLayout && 'es-row-results',
                ])}
                style={{ '--index': index }}
                ref={elementRef}
                onFocus={handleFocus}
                onBlur={handleBlur}
                tabIndex={-1}
                data-element-id={element.ID}
                data-shortcut-target="item-container"
                data-shortcut-target-selected={isSelected}
                data-testid={`message-item:${element.Subject}`}
            >
                <ItemCheckbox
                    ID={element.ID}
                    name={displayRecipients ? recipientsLabels[0] : sendersLabels[0]}
                    checked={checked}
                    onChange={handleCheck}
                    compactClassName="mr0-75 stop-propagation"
                    normalClassName={classnames(['ml0-1', columnLayout ? 'mr0-6 mt0-1' : 'mr0-5'])}
                />
                <ItemLayout
                    isCompactView={isCompactView}
                    labelID={labelID}
                    elementID={elementID}
                    labels={labels}
                    element={element}
                    conversationMode={conversationMode}
                    showIcon={showIcon}
                    senders={(displayRecipients ? recipientsLabels : sendersLabels).join(', ')}
                    addresses={(displayRecipients ? recipientsAddresses : sendersAddresses).join(', ')}
                    unread={unread}
                    displayRecipients={displayRecipients}
                    loading={loading}
                    breakpoints={breakpoints}
                    onBack={onBack}
                />
            </div>
        </div>
    );
};

export default memo(Item);
