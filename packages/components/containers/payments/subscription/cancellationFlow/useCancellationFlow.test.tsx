import { PLANS } from '@proton/payments/core/constants';
import { buildSubscription } from '@proton/payments/testing/buildSubscription';

import useSettingsLink from '../../../../components/link/useSettingsLink';
import { componentsHookRenderer } from '../../../contacts/tests/vitest/render';
import useCancellationFlow, { getCanUseCancellationReminder } from './useCancellationFlow';

vi.mock('../../../../components/link/useSettingsLink');
const mockGoToSettings = vi.fn();
vi.mocked(useSettingsLink).mockReturnValue(mockGoToSettings);

describe('getCanUseCancellationReminder', () => {
    it.each([
        [PLANS.BUNDLE_PRO_2024, true],
        [PLANS.MAIL_PRO, true],
        [PLANS.MAIL, true],
        [PLANS.DRIVE, true],
        [PLANS.PASS_BUSINESS, false],
        [PLANS.LUMO, false],
    ])('returns %s -> %s', (plan, expected) => {
        expect(getCanUseCancellationReminder(buildSubscription(plan))).toBe(expected);
    });
});

describe('useCancellationFlow', () => {
    it('redirects to the reminder page of the given subscription', () => {
        const { result } = componentsHookRenderer(() => useCancellationFlow());

        result.current.redirectToCancellationFlow({ ...buildSubscription(PLANS.MAIL), ID: 'sub-mail' });

        expect(mockGoToSettings).toHaveBeenCalledWith('/cancel-subscription?subscriptionId=sub-mail');
    });
});
