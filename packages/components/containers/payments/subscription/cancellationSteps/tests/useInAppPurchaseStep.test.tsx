import { useSubscription } from '@proton/account/subscription/hooks';
import { PLANS } from '@proton/payments/core/constants';
import { buildSubscription } from '@proton/payments/testing/buildSubscription';

import { useModalTwoPromise } from '../../../../../components/modalTwo/useModalTwo';
import { componentsHookRenderer } from '../../../../contacts/tests/render';
import { useInAppPurchaseStep } from '../useInAppPurchaseStep';

jest.mock('@proton/account/subscription/hooks');
jest.mock('../../../../../components/modalTwo/useModalTwo');

const mockShowModal = jest.fn();
const mailSubscription = { ...buildSubscription(PLANS.MAIL), ID: 'sub-mail' };
const lumoSubscription = { ...buildSubscription(PLANS.LUMO), ID: 'sub-lumo' };

describe('useInAppPurchaseStep', () => {
    beforeEach(() => {
        jest.resetAllMocks();
        jest.mocked(useModalTwoPromise).mockReturnValue([() => null, mockShowModal]);
        jest.mocked(useSubscription).mockReturnValue([mailSubscription, false]);
    });

    it('should show the modal for the given subscription when canShow returns true', async () => {
        const { result } = componentsHookRenderer(() => useInAppPurchaseStep({ canShow: async () => true }));

        await result.current.show(lumoSubscription);

        expect(mockShowModal).toHaveBeenCalledTimes(1);
        expect(mockShowModal).toHaveBeenCalledWith({ subscription: lumoSubscription });
    });

    it('should ask canShow about the given subscription', async () => {
        const canShow = jest.fn().mockResolvedValue(false);
        const { result } = componentsHookRenderer(() => useInAppPurchaseStep({ canShow }));

        await result.current.show(lumoSubscription);

        expect(canShow).toHaveBeenCalledWith(lumoSubscription);
        expect(mockShowModal).not.toHaveBeenCalled();
    });
});
