import { CSSProperties, ChangeEvent, DragEvent, useState } from 'react';
import { c } from 'ttag';
import { SimpleMap } from '@proton/shared/lib/interfaces/utils';
import { ContactFormatted, ContactGroup } from '@proton/shared/lib/interfaces/contacts';
import { addPlus } from '@proton/shared/lib/helpers/string';
import { classnames } from '../../../helpers';
import ContactGroupLabels from '../group/ContactGroupLabels';
import { ItemCheckbox } from '../../items';
import { Copy } from '../../../components/button';
import { useNotifications } from '../../../hooks';

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
                'item-container item-contact flex cursor-pointer bg-global-white',
                dragged && 'item-dragging',
                hasFocus && 'item-is-focused',
            ])}
            onFocus={handleFocus}
            onBlur={handleBlur}
            tabIndex={-1}
            data-element-id={contact.ID}
            data-shortcut-target="contact-container"
        >
            <div className="flex flex-nowrap w100 h100 mtauto mbauto flex-align-items-center opacity-on-hover-container">
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
                    </div>
                    <div className="item-secondline max-w100 text-ellipsis text-sm" title={emails.join(', ')}>
                        {emails.length ? (
                            addPlus(emails as any)
                        ) : (
                            <span className="placeholder">{c('Info').t`No email address`}</span>
                        )}
                    </div>
                </div>
                {hasPaidMail && contactGroups && (
                    <ContactGroupLabels
                        contactGroups={contactGroups}
                        className="mr0-5 flex-justify-end"
                        onDetails={onGroupDetails}
                    />
                )}
                {emails[0] && (
                    <Copy
                        value={emails[0]}
                        className="opacity-on-hover"
                        onCopy={handleCopyEmail}
                        tooltipText={c('Action').t`Copy email to clipboard`}
                        size="small"
                    />
                )}
            </div>
        </div>
    );
};

export default ContactRow;
