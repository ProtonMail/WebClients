import { APPS } from '@proton/shared/lib/constants';
import { ProtonConfig, UserModel } from '@proton/shared/lib/interfaces';

import isEligible from './eligibility';

describe('summer-2023 offer', () => {
    it('should not be available in Proton VPN settings', () => {
        const user = {
            isFree: true,
            canPay: true,
        } as UserModel;
        const protonConfig = {
            APP_NAME: APPS.PROTONVPN_SETTINGS,
        } as ProtonConfig;
        expect(
            isEligible({
                user,
                protonConfig,
            })
        ).toBe(false);
    });

    it('should be available in Proton Mail', () => {
        const user = {
            isFree: true,
            canPay: true,
        } as UserModel;
        const protonConfig = {
            APP_NAME: APPS.PROTONMAIL,
        } as ProtonConfig;
        expect(
            isEligible({
                user,
                protonConfig,
            })
        ).toBe(true);
    });

    it('should be available in Proton Calendar', () => {
        const user = {
            isFree: true,
            canPay: true,
        } as UserModel;
        const protonConfig = {
            APP_NAME: APPS.PROTONCALENDAR,
        } as ProtonConfig;
        expect(
            isEligible({
                user,
                protonConfig,
            })
        ).toBe(true);
    });
});
