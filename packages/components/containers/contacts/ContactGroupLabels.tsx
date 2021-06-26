import React, { MouseEvent } from 'react';
import { ContactGroup } from 'proton-shared/lib/interfaces/contacts/Contact';

import LabelStack, { LabelDescription } from '../../components/labelStack/LabelStack';
import { useModals } from '../../hooks';
import ContactGroupDetailsModal from './modals/ContactGroupDetailsModal';

interface Props {
    contactGroups: ContactGroup[];
    isStacked?: boolean;
    className?: string;
}

const ContactGroupLabels = ({ contactGroups, isStacked = true, className }: Props) => {
    const { createModal } = useModals();

    const labels = contactGroups.reduce((acc: LabelDescription[], contactGroup: ContactGroup) => {
        return contactGroup
            ? [
                  ...acc,
                  {
                      name: contactGroup.Name,
                      color: contactGroup.Color,
                      title: contactGroup.Name,
                      onClick: (event: MouseEvent) => {
                          createModal(<ContactGroupDetailsModal contactGroupID={contactGroup.ID} />);
                          event.stopPropagation();
                      },
                  },
              ]
            : acc;
    }, []);

    return <LabelStack className={className} labels={labels} isStacked={isStacked} />;
};

export default ContactGroupLabels;
