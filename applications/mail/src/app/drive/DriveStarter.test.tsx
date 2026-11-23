import { render } from '@testing-library/react';

import { useUser } from '@proton/account/user/hooks';
import { useConfig } from '@proton/app-context/useConfig';
import type { ProtonDriveClient } from '@proton/drive/sdk';
import { useDrive } from '@proton/drive/sdk';
import { APPS } from '@proton/shared/lib/constants';
import type { UserModel } from '@proton/shared/lib/interfaces/User';
import type { ProtonConfig } from '@proton/shared/lib/interfaces/config';

import DriveStarter from './DriveStarter';

vi.mock('@proton/drive/sdk', () => ({ useDrive: vi.fn() }));
vi.mock('@proton/account/user/hooks', () => ({ useUser: vi.fn() }));
vi.mock('@proton/app-context/useConfig', () => ({ useConfig: vi.fn() }));

const driveClient = { name: 'drive client' } as unknown as ProtonDriveClient;
const init = vi.fn();

const mockDrive = (drive: ProtonDriveClient | undefined) => {
    vi.mocked(useDrive).mockReturnValue({ init, drive } as unknown as ReturnType<typeof useDrive>);
};

const mockUser = (user: Partial<UserModel>) => {
    vi.mocked(useUser).mockReturnValue([user as UserModel, false]);
};

describe('DriveStarter', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(useConfig).mockReturnValue({ APP_NAME: APPS.PROTONMAIL, APP_VERSION: '5.0.1' } as ProtonConfig);
        mockUser({ Subscribed: 0 });
        mockDrive(undefined);
    });

    it("starts the Drive client with Mail's app name and version and the free plan", () => {
        render(<DriveStarter onReady={vi.fn()} />);

        expect(init).toHaveBeenCalledTimes(1);
        expect(init).toHaveBeenCalledWith({ appName: APPS.PROTONMAIL, appVersion: '5.0.1', userPlan: 'free' });
    });

    it('starts it with the paid plan for a paying user', () => {
        mockUser({ Subscribed: 1 });

        render(<DriveStarter onReady={vi.fn()} />);

        expect(init).toHaveBeenCalledWith(expect.objectContaining({ userPlan: 'paid' }));
    });

    it('does not start the client when one already exists', () => {
        mockDrive(driveClient);

        render(<DriveStarter onReady={vi.fn()} />);

        expect(init).not.toHaveBeenCalled();
    });

    it('hands the client to onReady once it exists', () => {
        const onReady = vi.fn();
        const { rerender } = render(<DriveStarter onReady={onReady} />);
        expect(onReady).not.toHaveBeenCalled();

        mockDrive(driveClient);
        rerender(<DriveStarter onReady={onReady} />);

        expect(onReady).toHaveBeenCalledTimes(1);
        expect(onReady).toHaveBeenCalledWith(driveClient);
    });
});
