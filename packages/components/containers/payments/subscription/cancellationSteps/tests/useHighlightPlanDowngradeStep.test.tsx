import { usePlans } from '@proton/account/plans/hooks';
import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import { usePreferredPlansMap } from '@proton/payments-hooks/ui/hooks/usePreferredPlansMap';
import { PLANS } from '@proton/payments/core/constants';
import { buildSubscription } from '@proton/payments/testing/buildSubscription';
import { getTestPlansMap } from '@proton/payments/testing/data-plans';
import { APPS } from '@proton/shared/lib/constants';

import { useModalTwoPromise } from '../../../../../components/modalTwo/useModalTwo';
import { componentsHookRenderer } from '../../../../contacts/tests/vitest/render';
import { useHighlightPlanDowngradeStep } from '../useHighlightPlanDowngradeStep';

vi.mock('@proton/account/plans/hooks');
vi.mock('@proton/account/subscription/hooks');
vi.mock('@proton/account/user/hooks');
vi.mock('@proton/payments-hooks/ui/hooks/usePreferredPlansMap');
vi.mock('../../../../../components/modalTwo/useModalTwo');

const mockShowModal = vi.fn();
const mailSubscription = { ...buildSubscription(PLANS.MAIL), ID: 'sub-mail' };
const lumoSubscription = { ...buildSubscription(PLANS.LUMO), ID: 'sub-lumo' };

describe('useHighlightPlanDowngradeStep', () => {
    beforeEach(() => {
        vi.resetAllMocks();
        vi.mocked(useModalTwoPromise).mockReturnValue([() => null, mockShowModal]);
        vi.mocked(useUser).mockReturnValue([{ ID: 'user-123' } as any, false]);
        vi.mocked(usePlans).mockReturnValue([undefined, false]);
        vi.mocked(usePreferredPlansMap).mockReturnValue({ plansMap: getTestPlansMap('USD') } as any);
    });

    it('should show the downgrade highlight for the given subscription', async () => {
        vi.mocked(useSubscription).mockReturnValue([lumoSubscription, false]);
        const { result } = componentsHookRenderer(() => useHighlightPlanDowngradeStep({ canShow: async () => true }));

        await result.current.show({ app: APPS.PROTONMAIL, subscription: mailSubscription });

        expect(mockShowModal).toHaveBeenCalledWith(
            expect.objectContaining({
                subscription: mailSubscription,
                shortPlan: expect.objectContaining({ plan: PLANS.MAIL }),
            })
        );
    });

    it('should skip the step when the given subscription has no downgrade highlight', async () => {
        vi.mocked(useSubscription).mockReturnValue([mailSubscription, false]);
        const { result } = componentsHookRenderer(() => useHighlightPlanDowngradeStep({ canShow: async () => true }));

        await result.current.show({ app: APPS.PROTONMAIL, subscription: lumoSubscription });

        expect(mockShowModal).not.toHaveBeenCalled();
    });
});
