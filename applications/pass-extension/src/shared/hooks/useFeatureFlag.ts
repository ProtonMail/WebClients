import { useSelector } from 'react-redux';

import { selectFeatureFlag } from '@proton/pass/store';
import type { PassFeature } from '@proton/pass/types/api/features';

export const useFeatureFlag = (feature: PassFeature): boolean => useSelector(selectFeatureFlag(feature));
