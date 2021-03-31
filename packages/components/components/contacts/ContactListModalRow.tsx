import React, { CSSProperties, ChangeEvent } from 'react';

import { ContactEmail, ContactGroup } from 'proton-shared/lib/interfaces/contacts/Contact';

import ContactGroupLabels from './ContactGroupLabels';
import { classnames } from '../../helpers';
import Checkbox from '../input/Checkbox';

interface Props {
    style: CSSProperties;
    onCheck: (e: ChangeEvent<HTMLInputElement>, contactID: string) => void;
    contact: ContactEmail;
    checked: boolean;
    contactGroupsMap?: { [key: string]: ContactGroup };
    isNarrow: boolean;
}

const ContactModalRow = ({ style, onCheck, contact, checked, contactGroupsMap = {}, isNarrow }: Props) => {
    const contactGroups = contact.LabelIDs.map((ID: string) => contactGroupsMap[ID]);

    return (
        <div style={style} className="flex">
            <div
                className={classnames([
                    'flex flex-nowrap flex-item-fluid h100 mtauto mbauto contact-list-row pl1 pr1',
                    checked && 'contact-list-row--selected',
                ])}
            >
                <Checkbox
                    className="flex-nowrap w100 h100"
                    checked={checked}
                    onChange={(e) => onCheck(e, contact.ID)}
                    aria-describedby={contact.ID}
                    id={contact.ID}
                >
                    <div
                        className={classnames([
                            'flex-item-fluid flex-align-items-center max-w100 h100',
                            !isNarrow && 'flex',
                        ])}
                    >
                        <div className={classnames(['pl1 flex', !isNarrow && 'w33'])}>
                            <span className="inline-block text-ellipsis max-w100 pr1">{contact.Name}</span>
                        </div>
                        <div className="flex-item-fluid flex on-mobile-pl1">
                            <span className="inline-block text-ellipsis max-w100 pr1">{contact.Email}</span>
                        </div>
                        {!isNarrow && contactGroups && (
                            <div className="w25 text-right">
                                <ContactGroupLabels contactGroups={contactGroups} />
                            </div>
                        )}
                    </div>
                </Checkbox>
            </div>
        </div>
    );
};

export default ContactModalRow;
