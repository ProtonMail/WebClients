import { createAsyncThunk } from '@reduxjs/toolkit';
import { addDays, getUnixTime } from 'date-fns';

import { type FeaturesTourState, featureTourActions } from '@proton/account';
import { FeatureCode } from '@proton/features/interface';
import { type FeaturesReducerState, updateFeature } from '@proton/features/reducer';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';

export const remindMeLaterAboutFeatureTourAction = createAsyncThunk<
    void,
    void,
    { state: FeaturesTourState & FeaturesReducerState; extra: ProtonThunkArguments }
>('featureTour/remindMeLater', async (_, { dispatch }) => {
    const expirationDate = getUnixTime(addDays(new Date(), 14));
    const spotlightDisplayDate = getUnixTime(addDays(new Date(), 1));
    await Promise.all([
        dispatch(updateFeature(FeatureCode.FeatureTourExpirationDate, expirationDate)),
        dispatch(updateFeature(FeatureCode.FeatureTourDrawerSpotlightDisplayDate, spotlightDisplayDate)),
    ]);
});

export const completedFeatureTourAction = createAsyncThunk<
    void,
    void,
    { state: FeaturesTourState & FeaturesReducerState; extra: ProtonThunkArguments }
>('featureTour/completed', async (_, { dispatch }) => {
    await Promise.all([
        dispatch(updateFeature(FeatureCode.FeatureTourExpirationDate, 0)),
        dispatch(updateFeature(FeatureCode.FeatureTourDrawerSpotlightDisplayDate, 0)),
    ]);
    dispatch(featureTourActions.hide());
});
