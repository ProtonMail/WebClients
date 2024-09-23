import { Fragment } from 'react';

import type { ContactEditProps } from '@proton/components';

import type { RecipientOrGroup } from '../../../models/address';
import type { MapStatusIcons } from '../../../models/crypto';
import RecipientItem from './RecipientItem';

interface Props {
    recipientsOrGroup: RecipientOrGroup[];
    mapStatusIcons?: MapStatusIcons;
    isLoading: boolean;
    showDropdown?: boolean;
    isOutside?: boolean;
    isPrintModal?: boolean;
    onContactDetails: (contactID: string) => void;
    onContactEdit: (props: ContactEditProps) => void;
}

const RecipientsList = ({
    recipientsOrGroup,
    mapStatusIcons,
    isLoading,
    showDropdown,
    isOutside,
    isPrintModal,
    onContactDetails,
    onContactEdit,
}: Props) => (
    <Fragment>
        {recipientsOrGroup.map((recipientOrGroup, index) => (
            <Fragment
                key={index} // eslint-disable-line react/no-array-index-key
            >
                <RecipientItem
                    recipientOrGroup={recipientOrGroup}
                    mapStatusIcons={mapStatusIcons}
                    isLoading={isLoading}
                    showDropdown={showDropdown}
                    isOutside={isOutside}
                    isRecipient={true}
                    isExpanded={true}
                    onContactDetails={onContactDetails}
                    onContactEdit={onContactEdit}
                    customDataTestId={`recipients:item-${
                        recipientOrGroup.group
                            ? recipientOrGroup.group.group?.Name
                            : recipientOrGroup.recipient?.Address
                    }`}
                />
                {isPrintModal && index < recipientsOrGroup.length - 1 && <span>, </span>}
            </Fragment>
        ))}
    </Fragment>
);

export default RecipientsList;
