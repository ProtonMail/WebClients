import { c } from 'ttag';

import { Loader } from '@proton/components';
import { IcExclamationCircleFilled } from '@proton/icons/icons/IcExclamationCircleFilled';
import { IcLockFilled } from '@proton/icons/icons/IcLockFilled';

import type { ShareInvitee } from '../../../../../store';

/**
 * Generates attributes for an address input item based on the loading state, error state, and email.
 * This function is meant to be use with the adress autocomplete input.
 */
export const getAddressInputItemAttributes = ({ isLoading, error, email, isExternal }: ShareInvitee) => {
    if (isLoading) {
        return {
            icon: <Loader className="icon-size-4 pl-2 m-auto flex shrink-0" />,
        };
    }
    if (error) {
        return {
            icon: (
                <div className="flex items-center shrink-0 ml-2">
                    <IcExclamationCircleFilled className="color-danger" data-testid="invite-address-error" />
                </div>
            ),
            iconTooltip: error.message,
            labelTooltip: email,
        };
    }
    if (isExternal) {
        return null;
    }
    return {
        icon: (
            <span className="inline-flex pl-2 shrink-0 my-auto">
                <IcLockFilled size={4} className={'color-info'} data-testid="invite-address-ok" />
            </span>
        ),
        iconTooltip: c('Tooltip').t`Shared with end-to-end encryption`,
        labelTooltip: email,
    };
};
