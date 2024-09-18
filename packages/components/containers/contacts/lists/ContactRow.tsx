import type { CSSProperties, ChangeEvent, DragEvent, MouseEvent } from 'react';
import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { Tooltip } from '@proton/components/components';
import Copy from '@proton/components/components/button/Copy';
import Icon from '@proton/components/components/icon/Icon';
import { addPlus } from '@proton/shared/lib/helpers/string';
import type { Recipient } from '@proton/shared/lib/interfaces';
import type { ContactFormatted, ContactGroup } from '@proton/shared/lib/interfaces/contacts';
import type { SimpleMap } from '@proton/shared/lib/interfaces/utils';
import clsx from '@proton/utils/clsx';

import { useNotifications } from '../../../hooks';
import { ItemCheckbox } from '../../items';
import ContactGroupLabels from '../group/ContactGroupLabels';
import { ContactRowItemFirstLine, ContactRowItemSecondLine } from './ContactRowItem';

interface Props {
    checked: boolean;
    onClick: (ID: string) => void;
    onCheck: (event: ChangeEvent) => void;
    style: CSSProperties;
    hasPaidMail: boolean;
    contactGroupsMap: SimpleMap<ContactGroup>;
    contact: ContactFormatted;
    draggable?: boolean;
    onDragStart?: (event: DragEvent) => void;
    onDragEnd?: (event: DragEvent) => void;
    dragged?: boolean;
    index: number;
    onFocus: (index: number) => void;
    onGroupDetails: (contactGroupID: string) => void;
    isDrawer?: boolean;
    onCompose?: (recipients: Recipient[], attachments: File[]) => void;
}

const ContactRow = ({
    checked,
    style,
    hasPaidMail,
    contactGroupsMap,
    contact,
    onClick,
    onCheck,
    draggable,
    onDragStart,
    onDragEnd,
    dragged,
    index,
    onFocus,
    onGroupDetails,
    isDrawer = false,
    onCompose,
}: Props) => {
    const { createNotification } = useNotifications();
    const { ID, Name, LabelIDs = [], emails = [] } = contact;
    const [hasFocus, setHasFocus] = useState(false);

    const contactGroups = contact.LabelIDs.map((ID) => contactGroupsMap[ID] as ContactGroup);

    const handleFocus = () => {
        setHasFocus(true);
        onFocus(index);
    };

    const handleBlur = () => {
        setHasFocus(false);
    };

    const handleCopyEmail = () => {
        if (emails[0]) {
            createNotification({
                type: 'success',
                text: c('Success').t`Email address copied to clipboard`,
            });
        }
    };

    const handleCompose = (e: MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        if (onCompose && emails[0]) {
            const recipient: Recipient = { Name: contact.Name, Address: emails[0] };
            onCompose([recipient], []);
        }
    };

    return (
        <div
            style={style}
            key={ID}
            onClick={() => onClick(ID)}
            draggable={draggable}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            className={clsx(
                'contact-item-container item-contact flex cursor-pointer bg-global-white group-hover-opacity-container interactive-pseudo-inset interactive--no-background',
                isDrawer && 'item-in-drawer',
                dragged && 'item-dragging',
                hasFocus && 'item-is-focused'
            )}
            onFocus={handleFocus}
            onBlur={handleBlur}
            tabIndex={-1}
            data-element-id={contact.ID}
            data-shortcut-target="contact-container"
            data-testid={`contact-item:${Name}`}
        >
            <div className="flex flex-nowrap w-full h-full my-auto items-start">
                <ItemCheckbox ID={ID} name={Name} checked={checked} onChange={onCheck} />
                <div className="flex-1 ml-2 conversation-titlesender">
                    <ContactRowItemFirstLine ID={ID} Name={Name} className={!!LabelIDs.length ? 'pr-4' : ''} />
                    <ContactRowItemSecondLine title={emails.join(', ')}>
                        {emails.length ? (
                            addPlus(emails as any)
                        ) : (
                            <span className="placeholder">{c('Info').t`No email address`}</span>
                        )}
                    </ContactRowItemSecondLine>
                    {hasPaidMail && contactGroups && (
                        <ContactGroupLabels
                            contactGroups={contactGroups}
                            className="mt-0.5"
                            onDetails={onGroupDetails}
                            leftToRight
                            maxNumber={4}
                        />
                    )}
                </div>
                {emails[0] && (
                    <span className="flex gap-4">
                        {onCompose && (
                            <div className="contact-item-hover-action-buttons">
                                <Tooltip title={c('Action').t`Compose`}>
                                    <Button color="weak" shape="ghost" icon onClick={handleCompose}>
                                        <Icon name="pen-square" alt={c('Action').t`Compose`} />
                                    </Button>
                                </Tooltip>
                            </div>
                        )}
                        <div className="contact-item-hover-action-buttons">
                            <Copy
                                value={emails[0]}
                                className={clsx(isDrawer && 'mr-1')}
                                onCopy={handleCopyEmail}
                                tooltipText={c('Action').t`Copy email to clipboard`}
                                shape="ghost"
                            />
                        </div>
                    </span>
                )}
            </div>
        </div>
    );
};

export default ContactRow;
