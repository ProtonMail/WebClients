import { AppStateManager } from '../../components/Core/AppStateManager';
import { createAuthStore, exposeAuthStore } from '../../lib/auth/store';
import type { AppState } from '../../types/worker/state';
import { AppStatus } from '../../types/worker/state';
import { createMemoryStore } from '../store';

export const TEST_LOCAL_ID = 0;

export type TestAppInit = Partial<AppState>;

export const setupTestApp = (app: TestAppInit = {}) => {
    const localID = app.localID ?? TEST_LOCAL_ID;
    const authStore = createAuthStore(createMemoryStore());
    authStore.setLocalID(localID);
    exposeAuthStore(authStore);

    AppStateManager.reset();
    AppStateManager.setState({ authorized: true, booted: true, status: AppStatus.READY, ...app, localID });

    return authStore;
};
