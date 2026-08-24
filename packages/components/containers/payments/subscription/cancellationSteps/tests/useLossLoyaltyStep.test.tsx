import { useOrganization } from '@proton/account/organization/hooks';

import { useModalTwoPromise } from '../../../../../components/modalTwo/useModalTwo';
import { componentsHookRenderer } from '../../../../contacts/tests/render';
import { useLossLoyaltyStep } from '../useLossLoyaltyStep';

jest.mock('@proton/account/organization/hooks');
jest.mock('../../../../../components/modalTwo/useModalTwo');

const mockShowModal = jest.fn();

describe('useLossLoyaltyStep', () => {
    beforeEach(() => {
        jest.resetAllMocks();
        jest.mocked(useModalTwoPromise).mockReturnValue([() => null, mockShowModal]);
        jest.mocked(useOrganization).mockReturnValue([{ Name: 'test' } as any, false]);
    });
    it('should call showModal when canShow returns true', async () => {
        const { result } = componentsHookRenderer(() => useLossLoyaltyStep({ canShow: async () => true }));

        await result.current.show();

        expect(mockShowModal).toHaveBeenCalledTimes(1);
    });

    it('should not call showModal when canShow returns false', async () => {
        const { result } = componentsHookRenderer(() => useLossLoyaltyStep({ canShow: async () => false }));

        await result.current.show();

        expect(mockShowModal).not.toHaveBeenCalled();
    });
});
