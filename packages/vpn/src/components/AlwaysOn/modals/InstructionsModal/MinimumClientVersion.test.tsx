import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { TelemetryVpnAlwaysOnPolicyEvents } from '@proton/shared/lib/api/telemetry';
import { sendTelemetryReport } from '@proton/shared/lib/helpers/metrics';

import { WINDOWS_DOWNLOAD_PAGE } from '../../../../hooks/useWindowsDownloadLinks';
import { MinimumClientVersion } from './MinimumClientVersion';

vi.mock('@proton/app-context/useApi', () => ({ useApi: vi.fn() }));
vi.mock('@proton/shared/lib/helpers/metrics', () => ({ sendTelemetryReport: vi.fn() }));

const links = [
    { title: 'Windows 10/11 (x64)', href: 'https://protonvpn.com/download/ProtonVPN_v5.3.0_x64.exe' },
    { title: 'Windows 10/11 (ARM64)', href: 'https://protonvpn.com/download/ProtonVPN_v5.3.0_arm64.exe' },
];

const renderVersion = (props: Partial<Parameters<typeof MinimumClientVersion>[0]> = {}) =>
    render(<MinimumClientVersion version="5.3.0" links={links} downloadPage={WINDOWS_DOWNLOAD_PAGE} {...props} />);

describe('MinimumClientVersion', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('offers every build under the call to action', async () => {
        renderVersion();

        expect(screen.getByText(/running Proton VPN desktop version 5\.3\.0 or later/)).toBeInTheDocument();

        await userEvent.click(screen.getByText('Download latest'));

        expect(screen.getByText('Windows 10/11 (x64)').closest('a')).toHaveAttribute('href', links[0].href);
        expect(screen.getByText('Windows 10/11 (ARM64)').closest('a')).toHaveAttribute('href', links[1].href);
    });

    it('reports the call to action and the build the admin picks separately', async () => {
        renderVersion();

        await userEvent.click(screen.getByText('Download latest'));

        expect(sendTelemetryReport).toHaveBeenCalledWith(
            expect.objectContaining({
                event: TelemetryVpnAlwaysOnPolicyEvents.downloadLatestClicked,
                dimensions: { source: 'build', version: '5.3.0' },
            })
        );
        expect(sendTelemetryReport).not.toHaveBeenCalledWith(
            expect.objectContaining({ event: TelemetryVpnAlwaysOnPolicyEvents.clientDownloadClicked })
        );

        await userEvent.click(screen.getByText('Windows 10/11 (ARM64)'));

        expect(sendTelemetryReport).toHaveBeenCalledWith(
            expect.objectContaining({
                event: TelemetryVpnAlwaysOnPolicyEvents.clientDownloadClicked,
                dimensions: { source: 'build', version: '5.3.0' },
            })
        );
    });

    it('links to the download page when no build can be offered', () => {
        renderVersion({ links: [] });

        expect(screen.getByText('Download latest')).toHaveAttribute('href', WINDOWS_DOWNLOAD_PAGE);
    });

    it('reports both the call to action and the download when there is no build to pick', async () => {
        renderVersion({ links: [] });

        await userEvent.click(screen.getByText('Download latest'));

        expect(sendTelemetryReport).toHaveBeenCalledWith(
            expect.objectContaining({
                event: TelemetryVpnAlwaysOnPolicyEvents.downloadLatestClicked,
                dimensions: { source: 'download-page', version: '5.3.0' },
            })
        );
        expect(sendTelemetryReport).toHaveBeenCalledWith(
            expect.objectContaining({
                event: TelemetryVpnAlwaysOnPolicyEvents.clientDownloadClicked,
                dimensions: { source: 'download-page', version: '5.3.0' },
            })
        );
    });
});
