import { MouseEvent } from 'react';

import { ContactGroup } from '@proton/shared/lib/interfaces/contacts/Contact';

import LabelStack, { LabelDescription } from '../../../components/labelStack/LabelStack';

interface Props {
    contactGroups: ContactGroup[];
    isStacked?: boolean;
    className?: string;
    onDetails: (contactGroupID: string) => void;
    maxNumber?: number;
    leftToRight?: boolean;
}

const ContactGroupLabels = ({
    contactGroups,
    isStacked = true,
    className,
    onDetails,
    leftToRight,
    maxNumber,
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
                          onDetails(contactGroup.ID);
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
