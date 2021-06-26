import React, { CSSProperties, ChangeEvent, DragEvent } from 'react';
import { c } from 'ttag';
import { SimpleMap } from 'proton-shared/lib/interfaces/utils';
import { ContactFormatted, ContactGroup } from 'proton-shared/lib/interfaces/contacts';
import { addPlus } from 'proton-shared/lib/helpers/string';
import { classnames } from '../../helpers';
import ContactGroupLabels from './ContactGroupLabels';
import { ItemCheckbox } from '../items';

interface Props {
    checked: boolean;
    onClick: (ID: string) => void;
    onCheck: (event: ChangeEvent) => void;
    style: CSSProperties;
    contactID: string;
    hasPaidMail: boolean;
    contactGroupsMap: SimpleMap<ContactGroup>;
    contact: ContactFormatted;
    draggable?: boolean;
    onDragStart?: (event: DragEvent) => void;
    onDragEnd?: (event: DragEvent) => void;
    dragged?: boolean;
}

const ContactRow = ({
    checked,
    style,
    contactID,
    hasPaidMail,
    contactGroupsMap,
    contact,
    onClick,
    onCheck,
    draggable,
    onDragStart,
    onDragEnd,
    dragged,
}: Props) => {
    const { ID, Name, LabelIDs = [], emails = [] } = contact;

    const contactGroups = contact.LabelIDs.map((ID) => contactGroupsMap[ID] as ContactGroup);

    return (
        // eslint-disable-next-line jsx-a11y/click-events-have-key-events,jsx-a11y/no-static-element-interactions
        <div
            style={style}
            key={ID}
            onClick={() => onClick(ID)}
            draggable={draggable}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            className={classnames([
                'item-container item-contact flex cursor-pointer bg-global-white',
                contactID === ID && 'item-is-selected',
                dragged && 'item-dragging',
            ])}
        >
            <div className="flex flex-nowrap w100 h100 mtauto mbauto flex-align-items-center">
                <ItemCheckbox ID={ID} name={Name} checked={checked} onChange={onCheck} />
                <div className="flex-item-fluid pl1 flex flex-column flex-justify-space-between conversation-titlesender">
                    <div className="flex flex-nowrap flex-align-items-center item-firstline max-w100">
                        <div className={classnames(['flex flex-item-fluid w0', !!LabelIDs.length && 'pr1'])}>
                            <span
                                role="heading"
                                aria-level={2}
                                className="text-bold inline-block max-w100 text-ellipsis"
                                id={ID}
                            >
                                {Name}
                            </span>
                        </div>
                        {hasPaidMail && contactGroups && <ContactGroupLabels contactGroups={contactGroups} />}
                    </div>
                    <div
                        className="item-secondline max-w100 text-ellipsis item-sender--smaller"
                        title={emails.join(', ')}
                    >
                        {emails.length ? (
                            addPlus(emails as any)
                        ) : (
                            <span className="placeholder">{c('Info').t`No email address`}</span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ContactRow;
