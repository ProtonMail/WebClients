import { useModalTwoPromise } from '@proton/components/components/modalTwo/useModalTwo';
import { componentsHookRenderer } from '@proton/components/containers/contacts/tests/render';

import { useCancelTrialStep } from '../useCancelTrialStep';

jest.mock('@proton/components/components/modalTwo/useModalTwo');

const mockShowModal = jest.fn();

describe('useCancelTrialStep', () => {
    beforeEach(() => {
        jest.resetAllMocks();
        jest.mocked(useModalTwoPromise).mockReturnValue([() => null, mockShowModal]);
    });
    it('should call showModal when canShow returns true', async () => {
        const { result } = componentsHookRenderer(() => useCancelTrialStep({ canShow: async () => true }));

        await result.current.show();

        expect(mockShowModal).toHaveBeenCalledTimes(1);
    });

    it('should not call showModal when canShow returns false', async () => {
        const { result } = componentsHookRenderer(() => useCancelTrialStep({ canShow: async () => false }));

        await result.current.show();

        expect(mockShowModal).not.toHaveBeenCalled();
    });
});
