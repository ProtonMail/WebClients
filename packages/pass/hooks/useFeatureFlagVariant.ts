import { useSelector } from 'react-redux';

import type { FeatureFlagVariantValue } from '../store/reducers';
import { selectFeatureFlagVariant } from '../store/selectors/user';
import type { PassFeature } from '../types/api/features';
import type { MaybeNull } from '../types/utils';

export const useFeatureFlagVariant = (feature: PassFeature): MaybeNull<FeatureFlagVariantValue> =>
    useSelector(selectFeatureFlagVariant(feature));
