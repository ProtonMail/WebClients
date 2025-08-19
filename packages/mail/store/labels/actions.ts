import type { ThunkAction, UnknownAction } from '@reduxjs/toolkit';

import type { AddressesState } from '@proton/account/addresses';
import type { KtState } from '@proton/account/kt';
import type { OrganizationKeyState } from '@proton/account/organizationKey';
import type { UserKeysState } from '@proton/account/userKeys';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import {
    checkLabelAvailability as checkLabelAvailabilityConfig,
    create as createConfig,
    deleteLabel as deleteLabelConfig,
    updateLabel as updateLabelConfig,
} from '@proton/shared/lib/api/labels';
import type { Category, Label } from '@proton/shared/lib/interfaces';

import { categoriesActions, getCategory } from './index';

type RequiredState = AddressesState & UserKeysState & OrganizationKeyState & KtState;

export const labelsThunk = ({
    label,
}: {
    label: Category;
}): ThunkAction<Promise<void>, RequiredState, ProtonThunkArguments, UnknownAction> => {
    return async (dispatch, getState, extra) => {
        const result = await getCategory(extra.api, label.ID);
        dispatch(categoriesActions.upsertCategory(result));
    };
};

export const checkLabelAvailable = ({
    label,
}: {
    label: Parameters<typeof checkLabelAvailabilityConfig>[0];
}): ThunkAction<Promise<void>, RequiredState, ProtonThunkArguments, UnknownAction> => {
    return async (dispatch, getState, extra) => {
        await extra.api<{ Label: Label }>(checkLabelAvailabilityConfig(label));
    };
};

export const createLabel = ({
    label,
}: {
    label: Parameters<typeof createConfig>[0];
}): ThunkAction<Promise<Label>, RequiredState, ProtonThunkArguments, UnknownAction> => {
    return async (dispatch, getState, extra) => {
        const { Label } = await extra.api<{ Label: Label }>(createConfig(label));
        dispatch(categoriesActions.upsertCategory(Label));
        return Label;
    };
};

export const updateLabel = ({
    labelID,
    label,
}: {
    labelID: string;
    label: Parameters<typeof updateLabelConfig>[1];
}): ThunkAction<Promise<Category>, RequiredState, ProtonThunkArguments, UnknownAction> => {
    return async (dispatch, getState, extra) => {
        const { Label } = await extra.api<{ Label: Label }>(updateLabelConfig(labelID, label));
        dispatch(categoriesActions.upsertCategory(Label));
        return Label;
    };
};

export const deleteLabel = ({
    label,
}: {
    label: Category;
}): ThunkAction<Promise<void>, RequiredState, ProtonThunkArguments, UnknownAction> => {
    return async (dispatch, getState, extra) => {
        await extra.api(deleteLabelConfig(label.ID));
        dispatch(categoriesActions.deleteCategory(label));
    };
};
