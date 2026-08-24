import { useSubscription } from '@proton/account/subscription/hooks';
import { buildSubscription } from '@proton/testing/builders/subscription';

import { useModalTwoPromise } from '../../../../../components/modalTwo/useModalTwo';
import { componentsHookRenderer } from '../../../../contacts/tests/render';
import { useInAppPurchaseStep } from '../useInAppPurchaseStep';

jest.mock('@proton/account/subscription/hooks');
jest.mock('../../../../../components/modalTwo/useModalTwo');

const mockShowModal = jest.fn();
const subscription = buildSubscription();

describe('useInAppPurchaseStep', () => {
    beforeEach(() => {
        jest.resetAllMocks();
        jest.mocked(useModalTwoPromise).mockReturnValue([() => null, mockShowModal]);
        jest.mocked(useSubscription).mockReturnValue([subscription, false]);
    });
    it('should call showModal when canShow returns true', async () => {
        const { result } = componentsHookRenderer(() => useInAppPurchaseStep({ canShow: async () => true }));

        await result.current.show();

        expect(mockShowModal).toHaveBeenCalledTimes(1);
    });

    it('should not call showModal when canShow returns false', async () => {
        const { result } = componentsHookRenderer(() => useInAppPurchaseStep({ canShow: async () => false }));

        await result.current.show();

        expect(mockShowModal).not.toHaveBeenCalled();
    });
});
