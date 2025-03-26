import { fireEvent, render, screen } from '@testing-library/react';

import * as browserHelper from '@proton/shared/lib/helpers/browser';

import GetVPNApp from './GetVPNApp';

jest.mock('@proton/shared/lib/helpers/browser', () => ({
    isMac: jest.fn(() => false),
    isWindows: jest.fn(() => false),
}));

describe('GetVPNApp', () => {
    const mockOnDownload = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should show desktop tab by default when not connected to VPN', () => {
        render(<GetVPNApp onDownload={mockOnDownload} isVpnConnection={false} />);

        const desktopTab = screen.getByTestId('tab-header-desktop-button');
        expect(desktopTab).toHaveAttribute('aria-selected', 'true');
        expect(screen.getByText('Download for Linux')).toBeInTheDocument();
    });

    it('should show mobile tab by default when connected to VPN', () => {
        render(<GetVPNApp onDownload={mockOnDownload} isVpnConnection={true} />);

        const mobileTab = screen.getByTestId('tab-header-mobile-button');
        expect(mobileTab).toHaveAttribute('aria-selected', 'true');
        expect(screen.getByText('Scan the QR code with your mobile device')).toBeInTheDocument();
    });

    it('should switch between desktop and mobile tabs', () => {
        render(<GetVPNApp onDownload={mockOnDownload} isVpnConnection={false} />);

        const mobileTab = screen.getByTestId('tab-header-mobile-button');
        fireEvent.click(mobileTab);

        expect(mobileTab).toHaveAttribute('aria-selected', 'true');
        expect(screen.getByText('Scan the QR code with your mobile device')).toBeInTheDocument();

        const desktopTab = screen.getByTestId('tab-header-desktop-button');
        fireEvent.click(desktopTab);

        expect(desktopTab).toHaveAttribute('aria-selected', 'true');
        expect(screen.getByText('Download for Linux')).toBeInTheDocument();
    });

    it('should call onDownload when clicking download button', () => {
        render(<GetVPNApp onDownload={mockOnDownload} isVpnConnection={false} />);

        const downloadButton = screen.getByText('Download for Linux');
        fireEvent.click(downloadButton);

        expect(mockOnDownload).toHaveBeenCalledTimes(1);
    });

    it('should show macOS download button when on Mac', () => {
        jest.spyOn(browserHelper, 'isMac').mockReturnValue(true);
        jest.spyOn(browserHelper, 'isWindows').mockReturnValue(false);

        render(<GetVPNApp onDownload={mockOnDownload} isVpnConnection={false} />);

        expect(screen.getByText('Download for macOS')).toBeInTheDocument();
    });

    it('should show Windows download button when on Windows', () => {
        jest.spyOn(browserHelper, 'isMac').mockReturnValue(false);
        jest.spyOn(browserHelper, 'isWindows').mockReturnValue(true);

        render(<GetVPNApp onDownload={mockOnDownload} isVpnConnection={false} />);

        expect(screen.getByText('Download for Windows')).toBeInTheDocument();
    });
});
