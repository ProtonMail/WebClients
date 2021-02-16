import React, { useEffect, useState, useRef, ChangeEvent, MouseEvent, DragEvent, memo, useMemo } from 'react';
import { classnames, Checkbox } from 'react-components';
import { getInitial } from 'proton-shared/lib/helpers/string';
import { Message } from 'proton-shared/lib/interfaces/mail/Message';
import { getRecipients as getMessageRecipients, getSender, isDraft, isSent } from 'proton-shared/lib/mail/messages';
import { MAILBOX_LABEL_IDS, DENSITY, VIEW_MODE } from 'proton-shared/lib/constants';
import { Label } from 'proton-shared/lib/interfaces/Label';
import { MailSettings, UserSettings } from 'proton-shared/lib/interfaces';
import ItemCheckbox from './ItemCheckbox';
import { isUnread, isMessage } from '../../helpers/elements';
import ItemColumnLayout from './ItemColumnLayout';
import ItemRowLayout from './ItemRowLayout';
import { Element } from '../../models/element';
import { getSenders, getRecipients as getConversationRecipients } from '../../helpers/conversation';
import { isCustomLabel } from '../../helpers/labels';
import { Breakpoints } from '../../models/utils';
import { useRecipientLabel } from '../../hooks/contact/useRecipientLabel';

const { SENT, ALL_SENT, ALL_MAIL, STARRED, DRAFTS, ALL_DRAFTS } = MAILBOX_LABEL_IDS;

const labelsWithIcons = [ALL_MAIL, STARRED, SENT, ALL_SENT, DRAFTS, ALL_DRAFTS] as string[];

interface Props {
    conversationMode: boolean;
    labels?: Label[];
    labelID: string;
    loading: boolean;
    elementID?: string;
    userSettings: UserSettings;
    mailSettings: MailSettings;
    columnLayout: boolean;
    element: Element;
    checked?: boolean;
    onCheck: (event: ChangeEvent, elementID: string) => void;
    onClick: (elementID: string | undefined) => void;
    onDragStart: (event: DragEvent, element: Element) => void;
    onDragEnd: (event: DragEvent) => void;
    dragged: boolean;
    index: number;
    breakpoints: Breakpoints;
    onFocus: (index: number) => void;
}

const Item = ({
    conversationMode,
    labelID,
    labels,
    loading,
    element,
    elementID,
    columnLayout,
    userSettings,
    mailSettings,
    checked = false,
    onCheck,
    onClick,
    onDragStart,
    onDragEnd,
    dragged,
    index,
    breakpoints,
    onFocus,
}: Props) => {
    const elementRef = useRef<HTMLDivElement>(null);
    const [hasFocus, setHasFocus] = useState(false);
    const displayRecipients =
        [SENT, ALL_SENT, DRAFTS, ALL_DRAFTS].includes(labelID as MAILBOX_LABEL_IDS) ||
        isSent(element) ||
        isDraft(element);
    const { getRecipientLabel, getRecipientsOrGroups, getRecipientsOrGroupsLabels } = useRecipientLabel();
    const isCompactView = userSettings.Density === DENSITY.COMPACT;
    const isConversationContentView = mailSettings.ViewMode === VIEW_MODE.GROUP;
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

    const itemCheckboxType = isCompactView ? (
        <Checkbox className="item-icon-compact mr0-75 stop-propagation" checked={checked} onChange={handleCheck} />
    ) : (
        <ItemCheckbox
            className={classnames(['item-checkbox-label ml0-1', columnLayout ? 'mr0-6' : 'mr0-5'])}
            checked={checked}
            onChange={handleCheck}
        >
            {getInitial(displayRecipients ? recipientsLabels[0] : sendersLabels[0])}
        </ItemCheckbox>
    );

    useEffect(() => {
        if (hasFocus) {
            elementRef?.current?.scrollIntoView?.({ block: 'nearest' });
        }
    }, [hasFocus]);

    return (
        <div
            onClick={handleClick}
            draggable
            onDragStart={(event) => onDragStart(event, element)}
            onDragEnd={onDragEnd}
            className={classnames([
                'flex flex-nowrap flex-align-items-center cursor-pointer',
                columnLayout ? 'item-container' : 'item-container-row',
                isSelected && 'item-is-selected',
                !unread && 'read',
                dragged && 'item-dragging',
                loading && 'item-is-loading',
                hasFocus && 'item-is-focused',
            ])}
            style={{ '--index': index }}
            ref={elementRef}
            onFocus={handleFocus}
            onBlur={handleBlur}
            tabIndex={-1}
            data-element-id={element.ID}
            data-shortcut-target="item-container"
            data-shortcut-target-selected={isSelected}
        >
            {itemCheckboxType}
            <ItemLayout
                labelID={labelID}
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
            />
        </div>
    );
};

export default memo(Item);
