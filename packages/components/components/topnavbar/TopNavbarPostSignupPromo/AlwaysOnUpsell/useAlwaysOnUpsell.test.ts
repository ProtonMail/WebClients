import { renderHook } from '@testing-library/react';

import { useUser } from '@proton/account/user/hooks';
import useConfig from '@proton/components/hooks/useConfig';
import type { ProtonConfig, UserModel } from '@proton/shared/lib/interfaces';
import useFlag from '@proton/unleash/useFlag';

import { getIsUserEligible, useAlwaysOnUpsell } from './useAlwaysOnUpsell';

const today = new Date();
const protonConfig = { APP_NAME: 'proton-mail' } as unknown as ProtonConfig;

jest.mock('@proton/components/hooks/useConfig');
const mockUseConfig = jest.mocked(useConfig);

jest.mock('@proton/account/user/hooks');
const mockUseUser = jest.mocked(useUser);

jest.mock('@proton/unleash/useFlag');
const mockUseFlag = jest.mocked(useFlag);

const freeUser = {
    isFree: true,
    isDelinquent: false,
    CreateTime: today.getTime() / 1000,
    Flags: { 'pass-lifetime': false },
} as UserModel;

describe('Always-on upsell eligibility', () => {
    describe('Hook tests', () => {
        beforeEach(() => {
            mockUseUser.mockReturnValue([freeUser, false]);
            mockUseConfig.mockReturnValue({ APP_NAME: 'proton-mail' } as any);
        });

        it('should be eligible, feature flag enabled', () => {
            mockUseFlag.mockReturnValue(true);
            const { result } = renderHook(() => useAlwaysOnUpsell());
            expect(result.current.isEligible).toBeTruthy();
        });

        it('should not be eligible, feature flag not enabled', () => {
            mockUseFlag.mockReturnValue(false);
            const { result } = renderHook(() => useAlwaysOnUpsell());
            expect(result.current.isEligible).toBeFalsy();
        });
    });

    describe('Helper tests', () => {
        it('should not be eligible, accont has pass lifetime', () => {
            const user = {
                isFree: true,
                isDelinquent: false,
                CreateTime: today.getTime() / 1000,
                Flags: { 'pass-lifetime': true },
            } as unknown as UserModel;

            expect(
                getIsUserEligible({
                    user,
                    protonConfig,
                })
            ).toBeFalsy();
        });

        it('should not be eligible, not free user', () => {
            const nonFreeUser = {
                isFree: false,
                isDelinquent: false,
                CreateTime: today.getTime() / 1000,
            } as unknown as UserModel;

            expect(
                getIsUserEligible({
                    user: nonFreeUser,
                    protonConfig,
                })
            ).toBeFalsy();
        });

        it('should not be eligible, delinquent', () => {
            const delinquentUser = {
                isFree: true,
                isDelinquent: true,
                CreateTime: today.getTime() / 1000,
            } as unknown as UserModel;

            expect(
                getIsUserEligible({
                    user: delinquentUser,
                    protonConfig,
                })
            ).toBeFalsy();
        });

        it('should not be eligible, wrong app', () => {
            expect(
                getIsUserEligible({
                    user: freeUser,
                    protonConfig: { APP_NAME: 'proton-calendar' } as unknown as ProtonConfig,
                })
            ).toBeFalsy();
        });
    });
});
