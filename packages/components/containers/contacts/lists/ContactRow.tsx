import { CSSProperties, ChangeEvent, DragEvent, useState } from 'react';

import { c } from 'ttag';

import { addPlus } from '@proton/shared/lib/helpers/string';
import { ContactFormatted, ContactGroup } from '@proton/shared/lib/interfaces/contacts';
import { SimpleMap } from '@proton/shared/lib/interfaces/utils';

import { Copy } from '../../../components/button';
import { classnames } from '../../../helpers';
import { useNotifications } from '../../../hooks';
import { ItemCheckbox } from '../../items';
import ContactGroupLabels from '../group/ContactGroupLabels';

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

    return (
        <div
            style={style}
            key={ID}
            onClick={() => onClick(ID)}
            draggable={draggable}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            className={classnames([
                'item-container item-contact flex cursor-pointer bg-global-white opacity-on-hover-container',
                isDrawer && 'item-in-drawer',
                dragged && 'item-dragging',
                hasFocus && 'item-is-focused',
            ])}
            onFocus={handleFocus}
            onBlur={handleBlur}
            tabIndex={-1}
            data-element-id={contact.ID}
            data-shortcut-target="contact-container"
        >
            <div className="flex flex-nowrap w100 h100 myauto flex-align-items-start">
                <ItemCheckbox ID={ID} name={Name} checked={checked} onChange={onCheck} />
                <div className="flex-item-fluid ml0-6 conversation-titlesender">
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
                    </div>
                    <div className="item-secondline max-w100 text-ellipsis text-sm" title={emails.join(', ')}>
                        {emails.length ? (
                            addPlus(emails as any)
                        ) : (
                            <span className="placeholder">{c('Info').t`No email address`}</span>
                        )}
                    </div>
                    {hasPaidMail && contactGroups && (
                        <ContactGroupLabels
                            contactGroups={contactGroups}
                            className="mt0-2"
                            onDetails={onGroupDetails}
                            leftToRight
                            maxNumber={4}
                        />
                    )}
                </div>
                {emails[0] && (
                    <div className="item-hover-action-buttons">
                        <Copy
                            value={emails[0]}
                            className={classnames([isDrawer && 'mr0-25'])}
                            onCopy={handleCopyEmail}
                            tooltipText={c('Action').t`Copy email to clipboard`}
                            size="small"
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default ContactRow;
