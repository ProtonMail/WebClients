import { render, screen } from '@testing-library/react';

import { APPS } from '@proton/shared/lib/constants';

import AppsLogos from './AppsLogos';

describe('AppsLogos', () => {
    it('renders all apps by default', () => {
        render(<AppsLogos />);
        expect(screen.getByRole('listitem', { name: 'Proton Mail' })).toBeInTheDocument();
        expect(screen.getByRole('listitem', { name: 'Proton Calendar' })).toBeInTheDocument();
        expect(screen.getByRole('listitem', { name: 'Proton Drive' })).toBeInTheDocument();
        expect(screen.getByRole('listitem', { name: 'Proton VPN' })).toBeInTheDocument();
        expect(screen.getByRole('listitem', { name: 'Proton Pass' })).toBeInTheDocument();
        expect(screen.getByRole('listitem', { name: 'Proton Wallet' })).toBeInTheDocument();
        expect(screen.getByRole('listitem', { name: 'Proton Docs' })).toBeInTheDocument();
    });

    it('renders only the specified apps', () => {
        render(<AppsLogos apps={[APPS.PROTONMAIL, APPS.PROTONDRIVE]} />);
        expect(screen.getByRole('listitem', { name: 'Proton Mail' })).toBeInTheDocument();
        expect(screen.getByRole('listitem', { name: 'Proton Drive' })).toBeInTheDocument();
        expect(screen.queryByRole('listitem', { name: 'Proton Calendar' })).not.toBeInTheDocument();
        expect(screen.queryByRole('listitem', { name: 'Proton VPN' })).not.toBeInTheDocument();
        expect(screen.queryByRole('listitem', { name: 'Proton Pass' })).not.toBeInTheDocument();
        expect(screen.queryByRole('listitem', { name: 'Proton Wallet' })).not.toBeInTheDocument();
        expect(screen.queryByRole('listitem', { name: 'Proton Docs' })).not.toBeInTheDocument();
    });

    it('does not render app names when appNames is false', () => {
        render(<AppsLogos appNames={false} />);
        // Should not find any short app names
        expect(screen.queryByText('Mail')).not.toBeInTheDocument();
        expect(screen.queryByText('Calendar')).not.toBeInTheDocument();
        expect(screen.queryByText('Drive')).not.toBeInTheDocument();
        expect(screen.queryByText('VPN')).not.toBeInTheDocument();
        expect(screen.queryByText('Pass')).not.toBeInTheDocument();
        expect(screen.queryByText('Wallet')).not.toBeInTheDocument();
        expect(screen.queryByText('Docs')).not.toBeInTheDocument();
    });

    it('renders all apps and greys out the ones not in the apps array when showDisabledApps is true', () => {
        render(<AppsLogos apps={[APPS.PROTONMAIL]} showDisabledApps />);
        const mail = screen.getByRole('listitem', { name: 'Proton Mail' });
        expect(mail).not.toHaveClass('opacity-40');
        const calendar = screen.getByRole('listitem', { name: 'Proton Calendar' });
        expect(calendar).toHaveClass('opacity-40');
        const drive = screen.getByRole('listitem', { name: 'Proton Drive' });
        expect(drive).toHaveClass('opacity-40');
        const vpn = screen.getByRole('listitem', { name: 'Proton VPN' });
        expect(vpn).toHaveClass('opacity-40');
        const pass = screen.getByRole('listitem', { name: 'Proton Pass' });
        expect(pass).toHaveClass('opacity-40');
        const wallet = screen.getByRole('listitem', { name: 'Proton Wallet' });
        expect(wallet).toHaveClass('opacity-40');
        expect(screen.queryByRole('listitem', { name: 'Proton Docs' })).toHaveClass('opacity-40');
    });

    it('renders all apps as enabled when showDisabledApps is true but no apps prop is provided', () => {
        render(<AppsLogos showDisabledApps />);
        expect(screen.getByRole('listitem', { name: 'Proton Mail' })).not.toHaveClass('opacity-40');
        expect(screen.getByRole('listitem', { name: 'Proton Calendar' })).not.toHaveClass('opacity-40');
        expect(screen.getByRole('listitem', { name: 'Proton Drive' })).not.toHaveClass('opacity-40');
        expect(screen.getByRole('listitem', { name: 'Proton VPN' })).not.toHaveClass('opacity-40');
        expect(screen.getByRole('listitem', { name: 'Proton Pass' })).not.toHaveClass('opacity-40');
        expect(screen.getByRole('listitem', { name: 'Proton Wallet' })).not.toHaveClass('opacity-40');
        expect(screen.getByRole('listitem', { name: 'Proton Docs' })).not.toHaveClass('opacity-40');
    });
});
