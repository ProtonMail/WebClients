import { render } from '@testing-library/react';

import { DriveIndexingProvider, useDriveIndexing } from './DriveIndexingProvider';

vi.mock('@proton/account/user/hooks', () => ({
    useUser: () => [{ ID: 'user-1' }],
}));

vi.mock('./IsGuestProvider', () => ({
    useIsGuest: () => false,
}));

vi.mock('../hooks/useFileProcessing', () => ({
    useFileProcessing: () => ({ processFile: vi.fn() }),
}));

const driveSdk = {
    browseFolderChildren: vi.fn(),
    getNode: vi.fn(),
    downloadFile: vi.fn(),
    subscribeToTreeEvents: vi.fn(),
    isInitialized: true,
};
vi.mock('../hooks/useDriveSDK', () => ({
    useDriveSDK: () => driveSdk,
}));

const lumoUserSettings: { indexedDriveFolders?: unknown[] } = {};
const updateSettings = vi.fn();
vi.mock('../hooks', () => ({
    useLumoUserSettings: () => ({ lumoUserSettings, updateSettings }),
}));

vi.mock('../redux/hooks', () => ({
    useLumoSelector: (selector: (state: unknown) => unknown) =>
        selector({ initialization: { spacesPullSettled: true } }),
}));

describe('DriveIndexingProvider', () => {
    it('settles when Drive is ready and the user has no indexed folders', () => {
        const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
        let renders = 0;
        const Consumer = () => {
            renders += 1;
            const { isSubscribed, subscribedScopes } = useDriveIndexing();
            return <span>{`${isSubscribed}:${subscribedScopes.length}`}</span>;
        };

        const { container } = render(
            <DriveIndexingProvider>
                <Consumer />
            </DriveIndexingProvider>
        );

        expect(container.textContent).toBe('false:0');
        expect(renders).toBeLessThan(5);
        expect(consoleError).not.toHaveBeenCalledWith(expect.stringContaining('Maximum update depth exceeded'));
        consoleError.mockRestore();
    });
});
