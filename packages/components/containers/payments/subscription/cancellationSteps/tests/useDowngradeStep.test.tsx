import { useUser } from '@proton/account/user/hooks';
import { useModalTwoPromise } from '@proton/components/components/modalTwo/useModalTwo';
import { componentsHookRenderer } from '@proton/components/containers/contacts/tests/render';
import { PRODUCT_BIT } from '@proton/shared/lib/constants';

import { useDowngradeStep } from '../useDowngradeStep';

jest.mock('@proton/account/user/hooks');
jest.mock('@proton/components/components/modalTwo/useModalTwo');

const mockShowModal = jest.fn();

describe('useDowngradeStep', () => {
    beforeEach(() => {
        jest.resetAllMocks();
        jest.mocked(useModalTwoPromise).mockReturnValue([() => null, mockShowModal]);
        jest.mocked(useUser).mockReturnValue([{ Subscribed: PRODUCT_BIT.MAIL } as any, false]);
    });
    it('should call showModal when canShow returns true', async () => {
        const { result } = componentsHookRenderer(() => useDowngradeStep({ canShow: async () => true }));

        await result.current.show();

        expect(mockShowModal).toHaveBeenCalledTimes(1);
    });

    it('should not call showModal when canShow returns false', async () => {
        const { result } = componentsHookRenderer(() => useDowngradeStep({ canShow: async () => false }));

        await result.current.show();

        expect(mockShowModal).not.toHaveBeenCalled();
    });
});
