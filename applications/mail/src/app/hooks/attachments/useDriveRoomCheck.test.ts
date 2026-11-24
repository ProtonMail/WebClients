import { renderHook } from '@testing-library/react';

import { mockUseUser } from '@proton/account/testing/vitest/mockUseUser';
import { useCanUpdateBilling } from '@proton/account/userPermissions/hooks';
import { mockUseNotifications } from '@proton/app-context/testing/vitest/mockUseNotifications';

import { useDriveRoomCheck } from './useDriveRoomCheck';

vi.mock('@proton/account/userPermissions/hooks', async () => ({
    ...(await vi.importActual('@proton/account/userPermissions/hooks')),
    useCanUpdateBilling: vi.fn(),
}));

const freeUpSpaceText = 'Not enough Drive storage to save this attachment. Free up space in Drive and try again.';
const contactAdministratorText =
    'Not enough Drive storage to save this attachment. Free up space in Drive or contact your administrator to get more storage.';

describe('useDriveRoomCheck', () => {
    const createNotification = vi.fn();
    const driveSpaceLeft = 4;

    const setup = (canUpdateBilling: [boolean, boolean] = [true, false]) => {
        mockUseUser([{ MaxDriveSpace: 10, UsedDriveSpace: 10 - driveSpaceLeft }]);
        mockUseNotifications({ createNotification });
        vi.mocked(useCanUpdateBilling).mockReturnValue(canUpdateBilling);
        return renderHook(() => useDriveRoomCheck());
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('lets the save go ahead with no message when the file fits', () => {
        const { result } = setup();

        expect(result.current.checkDriveRoom(driveSpaceLeft)).toBe(true);
        expect(createNotification).not.toHaveBeenCalled();
    });

    it('refuses and tells someone who can manage billing to free up space', () => {
        const { result } = setup([true, false]);

        expect(result.current.checkDriveRoom(driveSpaceLeft + 1)).toBe(false);
        expect(createNotification).toHaveBeenCalledTimes(1);
        expect(createNotification).toHaveBeenCalledWith({ text: freeUpSpaceText, type: 'error' });
    });

    it("tells someone who can't manage billing to contact their administrator", () => {
        const { result } = setup([false, false]);

        result.current.checkDriveRoom(driveSpaceLeft + 1);

        expect(createNotification).toHaveBeenCalledWith({ text: contactAdministratorText, type: 'error' });
    });

    it('uses the free-up-space wording while billing permissions are still loading', () => {
        const { result } = setup([false, true]);

        result.current.checkDriveRoom(driveSpaceLeft + 1);

        expect(createNotification).toHaveBeenCalledWith({ text: freeUpSpaceText, type: 'error' });
    });

    it('shows the same error on its own for a save Drive refused', () => {
        const { result } = setup();

        result.current.showDriveFullError();

        expect(createNotification).toHaveBeenCalledTimes(1);
        expect(createNotification).toHaveBeenCalledWith({ text: freeUpSpaceText, type: 'error' });
    });
});
