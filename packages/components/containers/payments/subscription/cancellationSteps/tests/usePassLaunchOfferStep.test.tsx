import { useSubscription } from '@proton/account/subscription/hooks';
import { useModalTwoPromise } from '@proton/components/components/modalTwo/useModalTwo';
import { componentsHookRenderer } from '@proton/components/containers/contacts/tests/render';
import { buildSubscription } from '@proton/testing/builders';

import { usePassLaunchOfferStep } from '../usePassLaunchOfferStep';

jest.mock('@proton/account/subscription/hooks');
jest.mock('@proton/components/components/modalTwo/useModalTwo');

const mockShowModal = jest.fn();
const subscription = buildSubscription();

describe('usePassLaunchOfferStep', () => {
    beforeEach(() => {
        jest.resetAllMocks();
        jest.mocked(useModalTwoPromise).mockReturnValue([() => null, mockShowModal]);
        jest.mocked(useSubscription).mockReturnValue([subscription, false]);
    });
    it('should call showModal when canShow returns true', async () => {
        const { result } = componentsHookRenderer(() => usePassLaunchOfferStep({ canShow: async () => true }));

        await result.current.show();

        expect(mockShowModal).toHaveBeenCalledTimes(1);
    });

    it('should not call showModal when canShow returns false', async () => {
        const { result } = componentsHookRenderer(() => usePassLaunchOfferStep({ canShow: async () => false }));

        await result.current.show();

        expect(mockShowModal).not.toHaveBeenCalled();
    });
});
