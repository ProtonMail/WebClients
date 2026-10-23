import type { ReactNode } from 'react';

import type { IconComponent } from '@proton/icons/component';
import type { PAYMENT_METHOD_TYPES } from '@proton/payments/core/constants';
import type { SavedMethodDetails, SavedMethodType, SavedPaymentMethod } from '@proton/payments/core/interface';

type NewMethodView = { icon?: IconComponent; text: string };

type SavedDetailsOf<T extends SavedMethodType> = Extract<SavedPaymentMethod, { Type: T }>['Details'];

type NewMethodUi = {
    newMethodView?: () => NewMethodView;
    renderOptionMark?: () => ReactNode;
};

export type SavedMethodUi<T extends SavedMethodType> = {
    savedMethodIcon?: (details: SavedDetailsOf<T>) => IconComponent;
    savedMethodLabel: (details: SavedDetailsOf<T>) => string;
    renderSavedMethodTableCell: (details: SavedDetailsOf<T>) => ReactNode;
    renderSavedMethodDetails?: (details: SavedMethodDetails) => ReactNode;
};

export type PaymentMethodUi<T extends PAYMENT_METHOD_TYPES> = NewMethodUi &
    (T extends SavedMethodType ? SavedMethodUi<T> : unknown);
