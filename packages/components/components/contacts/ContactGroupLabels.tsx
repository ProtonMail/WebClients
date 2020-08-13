import React from 'react';
import { ContactGroup } from 'proton-shared/lib/interfaces/contacts/Contact';
import LabelStack from '../labelStack/LabelStack';

interface Props {
    contactGroups: ContactGroup[];
}

const ContactGroupLabels = ({ contactGroups }: Props) => {
    const labels = contactGroups.map((contactGroup) => ({
        name: contactGroup.Name,
        color: contactGroup.Color,
        title: contactGroup.Name,
    }));

    return <LabelStack labels={labels} isStacked={true} showDelete={false} />;
};

export default ContactGroupLabels;
