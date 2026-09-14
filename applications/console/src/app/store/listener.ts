import { startSharedListening } from '@proton/redux-shared-store/sharedListeners';

import type { AppStartListening } from './store';

export const start = ({ startListening }: { startListening: AppStartListening }) => {
    startSharedListening(startListening);
};
