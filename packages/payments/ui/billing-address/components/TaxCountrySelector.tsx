import type { User } from '@proton/shared/lib/interfaces';

import { CollapsedTaxCountrySelector } from './CollapsedTaxCountrySelector';
import { InlineTaxCountrySelector, type InlineTaxCountrySelectorProps } from './InlineTaxCountrySelector';

interface Props extends InlineTaxCountrySelectorProps {
    user?: User;
    onInlineClick?: () => void | Promise<void>;
    loadingBillingAddressModal?: boolean;
}

function isAuthenticated(props: Props): props is Props & {
    user: User;
    onInlineClick: () => void | Promise<void>;
    loadingBillingAddressModal: boolean;
} {
    return props.user !== undefined;
}

export const TaxCountrySelector = (props: Props) => {
    if (isAuthenticated(props)) {
        return (
            <CollapsedTaxCountrySelector
                {...props}
                onClick={props.onInlineClick}
                loading={props.loadingBillingAddressModal}
            />
        );
    }

    return <InlineTaxCountrySelector {...props} />;
};
