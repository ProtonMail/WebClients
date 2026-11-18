import { useSubscription } from '@proton/account/subscription/hooks';
import { PLANS } from '@proton/payments/core/constants';
import { buildSubscription } from '@proton/payments/testing/buildSubscription';

import { useModalTwoPromise } from '../../../../../components/modalTwo/useModalTwo';
import { componentsHookRenderer } from '../../../../contacts/tests/vitest/render';
import { usePassLaunchOfferStep } from '../usePassLaunchOfferStep';

vi.mock('@proton/account/subscription/hooks');
vi.mock('../../../../../components/modalTwo/useModalTwo');

const mockShowModal = vi.fn();
const mailSubscription = { ...buildSubscription(PLANS.MAIL), ID: 'sub-mail' };
const lumoSubscription = { ...buildSubscription(PLANS.LUMO), ID: 'sub-lumo' };

describe('usePassLaunchOfferStep', () => {
    beforeEach(() => {
        vi.resetAllMocks();
        vi.mocked(useModalTwoPromise).mockReturnValue([() => null, mockShowModal]);
        vi.mocked(useSubscription).mockReturnValue([mailSubscription, false]);
    });

    it('should show the modal for the given subscription when canShow returns true', async () => {
        const { result } = componentsHookRenderer(() => usePassLaunchOfferStep({ canShow: async () => true }));

        await result.current.show(lumoSubscription);

        expect(mockShowModal).toHaveBeenCalledTimes(1);
        expect(mockShowModal).toHaveBeenCalledWith({ subscription: lumoSubscription });
    });

    it('should ask canShow about the given subscription', async () => {
        const canShow = vi.fn().mockResolvedValue(false);
        const { result } = componentsHookRenderer(() => usePassLaunchOfferStep({ canShow }));

        await result.current.show(lumoSubscription);

        expect(canShow).toHaveBeenCalledWith(lumoSubscription);
        expect(mockShowModal).not.toHaveBeenCalled();
    });
});
