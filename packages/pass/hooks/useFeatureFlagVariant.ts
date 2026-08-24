import { useSelector } from 'react-redux';

import type { FeatureFlagVariantValue } from '../store/reducers';
import { selectFeatureFlagVariant } from '../store/selectors';
import type { MaybeNull } from '../types';
import type { PassFeature } from '../types/api/features';

export const useFeatureFlagVariant = (feature: PassFeature): MaybeNull<FeatureFlagVariantValue> =>
    useSelector(selectFeatureFlagVariant(feature));
