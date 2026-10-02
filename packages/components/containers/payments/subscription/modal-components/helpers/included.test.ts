import { PLANS } from '@proton/payments/core/constants';
import { FREE_PLAN } from '@proton/payments/core/subscription/freePlans';
import { getTestPlansMap } from '@proton/payments/testing/data-plans';

import { get2FAAuthenticatorText, getLoginsAndNotesText, getSecureSharingText } from '../../../features/pass';
import { getWhatsIncluded } from './included';

describe('getWhatsIncluded', () => {
    it('lists the Pass basic features', () => {
        const included = getWhatsIncluded({
            planIDs: { [PLANS.PASS_BASIC]: 1 },
            plansMap: getTestPlansMap('CHF'),
            freePlan: FREE_PLAN,
            scribeToLumo: false,
        });

        expect(included.map((item) => item.type === 'text' && item.text)).toEqual([
            getLoginsAndNotesText(),
            '1 device per user',
            '1 vault per user',
            get2FAAuthenticatorText(),
            getSecureSharingText(true),
        ]);
    });
});
