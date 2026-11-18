import { useModalTwoPromise } from '../../../../../components/modalTwo/useModalTwo';
import { componentsHookRenderer } from '../../../../contacts/tests/vitest/render';
import { useCancelViaSupportStep } from '../useCancelViaSupportStep';

vi.mock('../../../../../components/modalTwo/useModalTwo');

const mockShowModal = vi.fn();

describe('useCancelViaSupportStep', () => {
    beforeEach(() => {
        vi.resetAllMocks();
        vi.mocked(useModalTwoPromise).mockReturnValue([() => null, mockShowModal]);
    });

    it('should call showModal when canShow returns true', async () => {
        const { result } = componentsHookRenderer(() => useCancelViaSupportStep({ canShow: async () => true }));

        await result.current.show();

        expect(mockShowModal).toHaveBeenCalledTimes(1);
    });

    it('should not call showModal when canShow returns false', async () => {
        const { result } = componentsHookRenderer(() => useCancelViaSupportStep({ canShow: async () => false }));

        await result.current.show();

        expect(mockShowModal).not.toHaveBeenCalled();
    });
});
