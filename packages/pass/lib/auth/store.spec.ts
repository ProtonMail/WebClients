import createStore from '@proton/shared/lib/helpers/store';

import { createAuthStore } from './store';
import { decodeUserData, encodeUserDataLegacy } from './store.utils';

describe('`AuthStore` userData', () => {
    test('V1 (backward compat): `setUserData` accepts legacy format and `decodeUserData` handles V1 transparently', () => {
        const authStore = createAuthStore(createStore());
        authStore.setUserData(encodeUserDataLegacy('legacy@example.com', 'Legacy User'));

        const result = decodeUserData(authStore.getUserData());
        expect(result.PrimaryEmail).toBe('legacy@example.com');
        expect(result.DisplayName).toBe('Legacy User');
    });
});
