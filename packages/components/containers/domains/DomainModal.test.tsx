import { fireEvent, screen } from '@testing-library/react';

import type { Domain } from '@proton/shared/lib/interfaces/Domain';
import { DKIM_STATE, VERIFY_STATE } from '@proton/shared/lib/interfaces/Domain';

import { renderWithProviders } from '../contacts/tests/render';
import DomainModal from './DomainModal';

jest.mock('@proton/account/domains/hooks', () => ({
    useCustomDomains: () => [undefined, true],
}));

const domain = {
    ID: 'domain-id',
    DomainName: 'mail.example.com',
    VerifyCode: 'protonmail-verification=code',
    VerifyState: VERIFY_STATE.VERIFY_STATE_GOOD,
    DKIM: {
        State: DKIM_STATE.DKIM_STATE_DEFAULT,
        Config: [{ Hostname: 'protonmail._domainkey', CNAME: 'dkim.example.net.', Key: null }],
    },
} as unknown as Domain;

describe('DomainModal DNS records', () => {
    it.each([
        ['Verify', 'mail'],
        ['DKIM', 'protonmail._domainkey.mail'],
        ['DMARC', '_dmarc.mail'],
    ])('shows the %s step hostname built for the domain subdomain', (step, hostname) => {
        renderWithProviders(<DomainModal open domain={domain} />);

        fireEvent.click(screen.getByTitle(step));

        expect(screen.getByText(hostname)).toBeInTheDocument();
    });
});
