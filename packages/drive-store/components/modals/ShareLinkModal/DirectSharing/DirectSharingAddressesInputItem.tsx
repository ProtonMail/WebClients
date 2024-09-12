import { AddressesInputItem } from '@proton/components';

import type { ShareInvitee } from '../../../../store';
import { getAddressInputItemAttributes } from './helpers/getAddressInputItemAttributes';

interface Props {
    invitee: ShareInvitee;
    disabled: boolean;
    onRemove: (email: string) => void;
}

export const DirectSharingAddressesInputItem = ({ invitee, disabled, onRemove }: Props) => {
    const inputItemAttributes = getAddressInputItemAttributes(invitee);

    return (
        <AddressesInputItem
            key={invitee.email}
            labelTooltipTitle={inputItemAttributes?.labelTooltip}
            label={invitee.name}
            labelProps={{
                className: 'py-1',
            }}
            removeProps={{
                disabled,
            }}
            icon={inputItemAttributes?.icon}
            iconTooltipTitle={inputItemAttributes?.iconTooltip}
            onClick={(event) => event.stopPropagation()}
            onRemove={() => onRemove(invitee.email)}
            data-testid="submitted-addresses"
        />
    );
};
