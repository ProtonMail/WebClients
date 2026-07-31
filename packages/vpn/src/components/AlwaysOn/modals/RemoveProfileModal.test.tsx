import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { RemoveProfileModal } from './RemoveProfileModal';

const downloadFileMock = vi.fn();
vi.mock('@proton/shared/lib/helpers/downloadFile', () => ({
    default: (...args: unknown[]) => downloadFileMock(...args),
}));

describe('RemoveProfileModal', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const windowsUninstall = { Filename: 'protonvpn-deviceprofile-remove.ps1', Content: '# uninstall script' };

    it('downloads the uninstall artifact from the policy instead of navigating', async () => {
        render(<RemoveProfileModal open onClose={vi.fn()} windowsUninstall={windowsUninstall} />);

        const [link] = screen.getAllByText(windowsUninstall.Filename);
        await userEvent.click(link);

        expect(downloadFileMock).toHaveBeenCalledTimes(1);
        const [blob, filename] = downloadFileMock.mock.calls[0];
        expect(blob).toBeInstanceOf(Blob);
        expect(filename).toBe(windowsUninstall.Filename);
        expect(await (blob as Blob).text()).toBe(windowsUninstall.Content);
    });

    it('does not attempt a download when the artifact is missing', async () => {
        render(<RemoveProfileModal open onClose={vi.fn()} />);

        const [link] = screen.getAllByText('protonvpn-deviceprofile-remove.ps1');
        await userEvent.click(link);

        expect(downloadFileMock).not.toHaveBeenCalled();
    });
});
