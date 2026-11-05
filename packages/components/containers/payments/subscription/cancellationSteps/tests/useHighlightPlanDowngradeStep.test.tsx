import { usePlans } from '@proton/account/plans/hooks';
import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import { usePreferredPlansMap } from '@proton/payments-hooks/ui/hooks/usePreferredPlansMap';
import { PLANS } from '@proton/payments/core/constants';
import { buildSubscription } from '@proton/payments/testing/buildSubscription';
import { getTestPlansMap } from '@proton/payments/testing/data-plans';
import { APPS } from '@proton/shared/lib/constants';

import { useModalTwoPromise } from '../../../../../components/modalTwo/useModalTwo';
import { componentsHookRenderer } from '../../../../contacts/tests/render';
import { useHighlightPlanDowngradeStep } from '../useHighlightPlanDowngradeStep';

jest.mock('@proton/account/plans/hooks');
jest.mock('@proton/account/subscription/hooks');
jest.mock('@proton/account/user/hooks');
jest.mock('@proton/payments-hooks/ui/hooks/usePreferredPlansMap');
jest.mock('../../../../../components/modalTwo/useModalTwo');

const mockShowModal = jest.fn();
const mailSubscription = { ...buildSubscription(PLANS.MAIL), ID: 'sub-mail' };
const lumoSubscription = { ...buildSubscription(PLANS.LUMO), ID: 'sub-lumo' };

describe('useHighlightPlanDowngradeStep', () => {
    beforeEach(() => {
        jest.resetAllMocks();
        jest.mocked(useModalTwoPromise).mockReturnValue([() => null, mockShowModal]);
        jest.mocked(useUser).mockReturnValue([{ ID: 'user-123' } as any, false]);
        jest.mocked(usePlans).mockReturnValue([undefined, false]);
        jest.mocked(usePreferredPlansMap).mockReturnValue({ plansMap: getTestPlansMap('USD') } as any);
    });

    it('should show the downgrade highlight for the given subscription', async () => {
        jest.mocked(useSubscription).mockReturnValue([lumoSubscription, false]);
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
        jest.mocked(useSubscription).mockReturnValue([mailSubscription, false]);
        const { result } = componentsHookRenderer(() => useHighlightPlanDowngradeStep({ canShow: async () => true }));

        await result.current.show({ app: APPS.PROTONMAIL, subscription: lumoSubscription });

        expect(mockShowModal).not.toHaveBeenCalled();
    });
});
