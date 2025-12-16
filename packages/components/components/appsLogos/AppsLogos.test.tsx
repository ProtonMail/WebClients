import { render, screen } from '@testing-library/react';

import { APPS } from '@proton/shared/lib/constants';

import AppsLogos from './AppsLogos';

describe('AppsLogos', () => {
    it('renders no apps by default', () => {
        render(<AppsLogos apps={[]} />);
        expect(screen.queryByRole('listitem', { name: 'Proton Mail' })).not.toBeInTheDocument();
        expect(screen.queryByRole('listitem', { name: 'Proton Calendar' })).not.toBeInTheDocument();
        expect(screen.queryByRole('listitem', { name: 'Proton Drive' })).not.toBeInTheDocument();
        expect(screen.queryByRole('listitem', { name: 'Proton VPN' })).not.toBeInTheDocument();
        expect(screen.queryByRole('listitem', { name: 'Proton Pass' })).not.toBeInTheDocument();
        expect(screen.queryByRole('listitem', { name: 'Proton Wallet' })).not.toBeInTheDocument();
        expect(screen.queryByRole('listitem', { name: 'Proton Docs' })).not.toBeInTheDocument();
        expect(screen.queryByRole('listitem', { name: 'Proton Sheets' })).not.toBeInTheDocument();
        expect(screen.queryByRole('listitem', { name: 'Lumo' })).not.toBeInTheDocument();
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
        expect(screen.queryByRole('listitem', { name: 'Proton Sheets' })).not.toBeInTheDocument();
        expect(screen.queryByRole('listitem', { name: 'Lumo' })).not.toBeInTheDocument();
    });

    it('does not render app names when appNames is false', () => {
        const { container } = render(<AppsLogos apps={[APPS.PROTONMAIL, APPS.PROTONDRIVE]} appNames={false} />);
        const appNameSpans = container.querySelectorAll('.apps-logos-app-name');
        expect(appNameSpans).toHaveLength(0);
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
});
