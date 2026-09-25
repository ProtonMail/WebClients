import { renderHook } from '@testing-library/react';
import { createActor } from 'xstate';

import type { Paths } from '../content/helper';
import { AuthType } from './auth/interface';
import { useSignInMachine } from './useSignInMachine';

jest.mock('@proton/app-context/useConfig', () => ({
    __esModule: true,
    useConfig: () => ({ APP_NAME: 'proton-account' }),
}));
jest.mock('@proton/components/hooks/useSilentApi', () => ({
    __esModule: true,
    useSilentApi: () => () => new Promise(() => {}),
}));
jest.mock('../useGetAccountKTActivation', () => ({ useGetAccountKTActivation: () => jest.fn() }));

const options = {
    productParam: undefined,
    externalRedirect: undefined,
    onPreSubmit: undefined,
    onStartAuth: () => Promise.resolve(),
    onLogin: jest.fn(),
    paths: {} as Paths,
};

describe('useSignInMachine', () => {
    it('keeps the machine, and running children call the latest callbacks', () => {
        const firstOnBack = jest.fn();
        const latestOnBack = jest.fn();
        const { result, rerender } = renderHook((onBack: () => void) => useSignInMachine({ ...options, onBack }), {
            initialProps: firstOnBack,
        });
        const machine = result.current;

        // The credentials step starts with the page and lives as long as it
        const actor = createActor(machine, {
            input: {
                username: '',
                authTypeData: { type: AuthType.Srp },
                canNavigateBack: true,
                redirectsSSOToAccount: false,
                externalSSO: undefined,
                showSSONotice: false,
                setupVPN: false,
            },
        }).start();

        rerender(latestOnBack);
        expect(result.current === machine).toBe(true);

        actor.getSnapshot().children.credentials?.send({ type: 'decision.back' });
        expect(firstOnBack).not.toHaveBeenCalled();
        expect(latestOnBack).toHaveBeenCalledTimes(1);
        actor.stop();
    });
});
