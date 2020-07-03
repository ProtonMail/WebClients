import React from 'react';
import { ContactGroup } from 'proton-shared/lib/interfaces/contacts/Contact';

interface Props {
    contactGroups: ContactGroup[];
}

const ContactGroupLabels = ({ contactGroups }: Props) => (
    <div
        className="inline-flex mw100 flew-row flex-nowrap flex-items-center pm-badgeLabel-container stop-propagation pm-badgeLabel-container--collapsed"
        role="list"
    >
        {contactGroups.map((contactGroup: ContactGroup) => (
            <span
                className="badgeLabel flex flex-row flex-items-center"
                style={{
                    color: contactGroup.Color
                }}
                key={contactGroup.ID}
            >
                <span className="pm-badgeLabel-link ellipsis mw100 color-white nodecoration">{contactGroup.Name}</span>
            </span>
        ))}
    </div>
);

export default ContactGroupLabels;
