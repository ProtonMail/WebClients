import { useSelector } from 'react-redux';

import { selectFeatureFlag, selectFeatureFlagsReady } from '../store/selectors';
import type { PassFeature } from '../types/api/features';

export const useFeatureFlag = (feature: PassFeature): boolean => useSelector(selectFeatureFlag(feature));

export const useFeatureFlagsReady = (): boolean => useSelector(selectFeatureFlagsReady);
