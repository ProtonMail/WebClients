import React, { MouseEvent } from 'react';
import { APPS } from 'proton-shared/lib/constants';
import { ContactGroup } from 'proton-shared/lib/interfaces/contacts/Contact';
import LabelStack, { LabelDescription } from '../labelStack/LabelStack';
import { useAppLink } from '../link';

interface Props {
    contactGroups: ContactGroup[];
    isStacked?: boolean;
    className?: string;
}

const ContactGroupLabels = ({ contactGroups, isStacked = true, className }: Props) => {
    const appLink = useAppLink();

    const labels = contactGroups.reduce((acc: LabelDescription[], contactGroup: ContactGroup) => {
        return contactGroup
            ? [
                  ...acc,
                  {
                      name: contactGroup.Name,
                      color: contactGroup.Color,
                      title: contactGroup.Name,
                      onClick: (event: MouseEvent) => {
                          appLink(`/?contactGroupID=${contactGroup.ID}`, APPS.PROTONCONTACTS);
                          event.stopPropagation();
                      },
                  },
              ]
            : acc;
    }, []);

    return <LabelStack className={className} labels={labels} isStacked={isStacked} />;
};

export default ContactGroupLabels;
