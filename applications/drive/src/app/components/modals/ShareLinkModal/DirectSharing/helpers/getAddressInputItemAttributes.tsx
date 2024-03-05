import { c } from 'ttag';

import { Icon, Loader } from '@proton/components/components';

import { ShareInvitee } from '../../../../../store';

/**
 * Generates attributes for an address input item based on the loading state, error state, and email.
 * This function is meant to be use with the adress autocomplete input.
 */
export const getAddressInputItemAttributes = ({ isLoading, isExternal, error, email }: ShareInvitee) => {
    if (isLoading) {
        return {
            icon: <Loader className="icon-16p pl-2 m-auto flex shrink-0" />,
        };
    }
    if (error) {
        return {
            icon: (
                <div className="flex items-center shrink-0 ml-2">
                    <Icon name="exclamation-circle" />
                </div>
            ),
            iconTooltip: error.message,
            labelTooltip: email,
        };
    }
    if (isExternal) {
        return undefined;
    }
    return {
        icon: (
            <span className="inline-flex pl-2 shrink-0 my-auto">
                <Icon size={4} name="lock-filled" className={'color-info'} />
            </span>
        ),
        iconTooltip: c('Tooltip').t`Shared end-to-end encrypted`,
        labelTooltip: email,
    };
};
