import React from 'react';
import { ContactGroup } from 'proton-shared/lib/interfaces/contacts/Contact';
import LabelStack, { LabelDescription } from '../labelStack/LabelStack';

interface Props {
    contactGroups: ContactGroup[];
}

const ContactGroupLabels = ({ contactGroups }: Props) => {
    const labels = contactGroups.reduce((acc: LabelDescription[], contactGroup: ContactGroup) => {
        return contactGroup
            ? [
                  ...acc,
                  {
                      name: contactGroup.Name,
                      color: contactGroup.Color,
                      title: contactGroup.Name,
                  },
              ]
            : acc;
    }, []);

    return <LabelStack labels={labels} isStacked />;
};

export default ContactGroupLabels;
