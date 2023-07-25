import { useSelector } from 'react-redux';

import { selectUserFeature } from '@proton/pass/store';
import type { PassFeature } from '@proton/pass/types/api/features';

export const useFeatureFlag = (feature: PassFeature): boolean => useSelector(selectUserFeature(feature));
