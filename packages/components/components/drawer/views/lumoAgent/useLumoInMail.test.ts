import { act, renderHook } from '@testing-library/react-hooks';

import { buildUser } from '@proton/account/testing/buildUser';
import { useUser } from '@proton/account/user/hooks';
import { mockUseConfig } from '@proton/app-context/testing/mockUseConfig';
import { APPS } from '@proton/shared/lib/constants';
import { useFlag } from '@proton/unleash/useFlag';

import useLumoInMail from './useLumoInMail';
import useLumoInMailPreference from './useLumoInMailPreference';

jest.mock('@proton/account/user/hooks', () => ({ useUser: jest.fn() }));
jest.mock('@proton/unleash/useFlag', () => ({ useFlag: jest.fn() }));

const USER_A = 'user-a';
const USER_B = 'user-b';

const signInAs = (userID: string) => {
    jest.mocked(useUser).mockReturnValue([buildUser({ ID: userID }), false]);
};

describe('useLumoInMail', () => {
    beforeEach(() => {
        localStorage.clear();
        mockUseConfig();
        jest.mocked(useFlag).mockReturnValue(true);
        signInAs(USER_A);
    });

    it('is on when the flag is on in Mail and nothing is stored', () => {
        const { result } = renderHook(() => useLumoInMail());

        expect(result.current).toBe(true);
    });

    it('is off when the flag is on but the user turned Lumo off', () => {
        localStorage.setItem(`lumo-in-mail-enabled-${USER_A}`, 'false');

        const { result } = renderHook(() => useLumoInMail());

        expect(result.current).toBe(false);
    });

    it("keeps another user's off choice from applying to this user", () => {
        const userAPreference = renderHook(() => useLumoInMailPreference());
        act(() => {
            const [, setEnabled] = userAPreference.result.current;
            setEnabled(false);
        });
        signInAs(USER_B);

        const { result } = renderHook(() => useLumoInMail());

        expect(result.current).toBe(true);
    });

    it('is off when the flag is off, even with the preference stored on', () => {
        localStorage.setItem(`lumo-in-mail-enabled-${USER_A}`, 'true');
        jest.mocked(useFlag).mockReturnValue(false);

        const { result } = renderHook(() => useLumoInMail());

        expect(result.current).toBe(false);
    });

    it('is off outside the Mail app, even with the flag on and nothing stored', () => {
        mockUseConfig({ APP_NAME: APPS.PROTONDRIVE });

        const { result } = renderHook(() => useLumoInMail());

        expect(result.current).toBe(false);
    });

    it('follows a change made by another mounted instance without a remount', () => {
        const toggle = renderHook(() => useLumoInMailPreference());
        const otherPreference = renderHook(() => useLumoInMailPreference());
        const gate = renderHook(() => useLumoInMail());

        act(() => {
            const [, setEnabled] = toggle.result.current;
            setEnabled(false);
        });

        expect(otherPreference.result.current[0]).toBe(false);
        expect(gate.result.current).toBe(false);
    });
});
