import { consumeSSOPersistent, saveSSOPersistent } from './ssoPersistedState';

describe('ssoPersistedState', () => {
    afterEach(() => {
        window.sessionStorage.clear();
    });

    it.each([true, false])('reads back %s once, then nothing', (persistent) => {
        saveSSOPersistent(persistent);
        expect(consumeSSOPersistent()).toBe(persistent);
        expect(consumeSSOPersistent()).toBeUndefined();
    });

    it('reads nothing when nothing was saved', () => {
        expect(consumeSSOPersistent()).toBeUndefined();
    });
});
