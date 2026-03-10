import { useSelector } from 'react-redux';

import type { FeatureFlagVariantValue } from '@proton/pass/store/reducers';
import { selectFeatureFlagVariant } from '@proton/pass/store/selectors';
import type { MaybeNull } from '@proton/pass/types';
import type { PassFeature } from '@proton/pass/types/api/features';

export const useFeatureFlagVariant = (feature: PassFeature): MaybeNull<FeatureFlagVariantValue> =>
    useSelector(selectFeatureFlagVariant(feature));
