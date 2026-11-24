import type { MouseEvent } from 'react';

import type { LabelDescription } from '@proton/components/components/labelStack/LabelStack';
import LabelStack from '@proton/components/components/labelStack/LabelStack';
import type { ContactGroup } from '@proton/shared/lib/interfaces/contacts/Contact';

interface Props {
    contactGroups: ContactGroup[];
    isStacked?: boolean;
    className?: string;
    onDetails: (contactGroupID: string, onCloseContactDetailsModal?: () => void) => void;
    maxNumber?: number;
    leftToRight?: boolean;
    onCloseModal?: () => void;
}

const ContactGroupLabels = ({
    contactGroups,
    isStacked = true,
    className,
    onDetails,
    leftToRight,
    maxNumber,
    onCloseModal,
}: Props) => {
    const labels = contactGroups.reduce((acc: LabelDescription[], contactGroup: ContactGroup) => {
        return contactGroup
            ? [
                  ...acc,
                  {
                      name: contactGroup.Name,
                      color: contactGroup.Color,
                      title: contactGroup.Name,
                      onClick: (event: MouseEvent) => {
                          onDetails(contactGroup.ID, onCloseModal);
                          event.stopPropagation();
                      },
                  },
              ]
            : acc;
    }, []);

    return (
        <LabelStack
            className={className}
            labels={labels}
            isStacked={isStacked}
            leftToRight={leftToRight}
            maxNumber={maxNumber}
        />
    );
};

export default ContactGroupLabels;
