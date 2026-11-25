import { APPS } from '@proton/shared/lib/constants';

import { getSsoAppInfo } from './ssoAppInfo';

describe('getSsoAppInfo', () => {
    it('gives Console an upsell plan, so the upsell has its Upgrade button', () => {
        expect(getSsoAppInfo(APPS.PROTONCONSOLE).upsellPlan).toBeDefined();
    });

    it('gives no upsell plan outside the SSO apps', () => {
        expect(getSsoAppInfo(APPS.PROTONMAIL).upsellPlan).toBeUndefined();
    });
});
