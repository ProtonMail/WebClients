import { useSelector } from 'react-redux';

import { selectUserFeature } from '@proton/pass/store';
import type { MaybeNull } from '@proton/pass/types';
import type { PassFeature } from '@proton/pass/types/api/features';

export const useFeatureFlag = <T extends any>(feature: PassFeature): MaybeNull<T> =>
    useSelector(selectUserFeature<T>(feature));
