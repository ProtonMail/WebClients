import { getIsPurchaseRefused } from '@proton/payments/core/errors';
import type { SubscriptionSelection } from '@proton/payments/core/subscription/helpers';
import { isSubscriptionSelectionEqual } from '@proton/payments/core/subscription/helpers';
import { getApiErrorMessage } from '@proton/shared/lib/api/helpers/apiErrorHelper';

import type { Model } from './SubscriptionContainer';

interface InitialCheckRefusalParams {
    model: Model;
    checkedSelection: SubscriptionSelection;
    openingSelection: SubscriptionSelection;
    error: unknown;
}

export const getInitialCheckRefusal = ({
    model,
    checkedSelection,
    openingSelection,
    error,
}: InitialCheckRefusalParams): string | undefined => {
    const isOpeningSelection = isSubscriptionSelectionEqual(checkedSelection, openingSelection);
    if (model.initialCheckComplete || !isOpeningSelection || !getIsPurchaseRefused(error)) {
        return undefined;
    }

    return getApiErrorMessage(error);
};
