import { renderHook } from '@testing-library/react';

import { getModelState } from '@proton/account/test';
import type { UserModel } from '@proton/shared/lib/interfaces';
import { getStoreWrapper } from '@proton/testing/index';

import type { MailState } from 'proton-mail/store/rootReducer';

import useFetchMailUpsellModalConfig from './useFetchMailUpsellModalConfig';

jest.mock('./useUpsellConfig', () => {
    return {
        getUpsellConfig: () => ({
            upgradePath: 'fake-upgrade-path',
            onUpgrade: undefined, // for testing purpose we don't need this function.
        }),
    };
});

describe('useFetchMailUpsellModalConfig', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    const setupTest = (preloadedState: Partial<MailState>) => {
        const { Wrapper, store } = getStoreWrapper(preloadedState);
        const { result, rerender, unmount } = renderHook(() => useFetchMailUpsellModalConfig(), {
            wrapper: Wrapper,
        });
        const fetchUpsellConfig = result.current;

        return { fetchUpsellConfig, store, rerender, unmount };
    };

    it('Should return the Proton Unlimited as default config in case of issue', async () => {
        const { fetchUpsellConfig } = setupTest({
            user: getModelState({ isFree: false } as UserModel),
        });

        const config = await fetchUpsellConfig({});

        expect(config).toMatchObject({
            cycle: 12,
            planIDs: { bundle2022: 1 },
            submitText: 'Get Proton Unlimited',
            footerText: '',
            upgradePath: 'fake-upgrade-path',
            onUpgrade: undefined,
        });
    });
});
