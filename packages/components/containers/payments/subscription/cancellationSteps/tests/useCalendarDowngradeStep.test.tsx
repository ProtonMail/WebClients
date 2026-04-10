import { useModalTwoPromise } from '@proton/components/components/modalTwo/useModalTwo';
import { componentsHookRenderer } from '@proton/components/containers/contacts/tests/render';

import { useCalendarDowngradeStep } from '../useCalendarDowngradeStep';

jest.mock('@proton/components/components/modalTwo/useModalTwo');

const mockShowModal = jest.fn();

describe('useCalendarDowngradeStep', () => {
    beforeEach(() => {
        jest.resetAllMocks();
        jest.mocked(useModalTwoPromise).mockReturnValue([() => null, mockShowModal]);
    });

    it('should call showModal when canShow returns true', async () => {
        const { result } = componentsHookRenderer(() => useCalendarDowngradeStep({ canShow: async () => true }));

        await result.current.show();

        expect(mockShowModal).toHaveBeenCalledTimes(1);
    });

    it('should not call showModal when canShow returns false', async () => {
        const { result } = componentsHookRenderer(() => useCalendarDowngradeStep({ canShow: async () => false }));

        await result.current.show();

        expect(mockShowModal).not.toHaveBeenCalled();
    });
});
