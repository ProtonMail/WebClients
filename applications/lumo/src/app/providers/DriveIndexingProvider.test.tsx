import { render } from '@testing-library/react';

import { DriveIndexingProvider, useDriveIndexing } from './DriveIndexingProvider';

jest.mock('@proton/account/user/hooks', () => ({
    useUser: () => [{ ID: 'user-1' }],
}));

jest.mock('./IsGuestProvider', () => ({
    useIsGuest: () => false,
}));

jest.mock('../hooks/useFileProcessing', () => ({
    useFileProcessing: () => ({ processFile: jest.fn() }),
}));

const driveSdk = {
    browseFolderChildren: jest.fn(),
    getNode: jest.fn(),
    downloadFile: jest.fn(),
    subscribeToTreeEvents: jest.fn(),
    isInitialized: true,
};
jest.mock('../hooks/useDriveSDK', () => ({
    useDriveSDK: () => driveSdk,
}));

const lumoUserSettings: { indexedDriveFolders?: unknown[] } = {};
const updateSettings = jest.fn();
jest.mock('../hooks', () => ({
    useLumoUserSettings: () => ({ lumoUserSettings, updateSettings }),
}));

jest.mock('../redux/hooks', () => ({
    useLumoSelector: (selector: (state: unknown) => unknown) =>
        selector({ initialization: { spacesPullSettled: true } }),
}));

describe('DriveIndexingProvider', () => {
    it('settles when Drive is ready and the user has no indexed folders', () => {
        const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
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
