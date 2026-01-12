import type { PassSaga } from '@proton/pass/store/types';

import offlineResume from './client/offline-resume.saga';
import offlineToggle from './client/offline-toggle.saga';

export const WEB_SAGAS: PassSaga[] = [offlineResume, offlineToggle];
