import React from 'react';
import { ContactGroup, ContactEmail } from 'proton-shared/lib/interfaces/contacts/Contact';

interface Props {
    contact: ContactEmail;
    contactGroupMap?: { [key: string]: ContactGroup };
}

const ContactGroupLabels = ({ contact, contactGroupMap = {} }: Props) => (
    <div
        className="inline-flex mw100 flew-row flex-nowrap flex-items-center pm-badgeLabel-container stop-propagation pm-badgeLabel-container--collapsed"
        role="list"
    >
        {contact.LabelIDs.map((ID: string) => {
            const contactGroup: ContactGroup = contactGroupMap[ID];

            return contactGroup ? (
                <span
                    className="badgeLabel flex flex-row flex-items-center"
                    style={{
                        color: contactGroup.Color
                    }}
                    key={ID}
                >
                    <span className="pm-badgeLabel-link ellipsis mw100 color-white nodecoration">
                        {contactGroup.Name}
                    </span>
                </span>
            ) : null;
        })}
    </div>
);

export default ContactGroupLabels;
