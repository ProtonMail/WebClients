import { screen } from '@testing-library/react';

import { easySwitchRender } from '@proton/activation/src/tests/render';

import DNSGroupRecords, { type DNSGroup } from './DNSGroupRecords';

const group: DNSGroup = {
    name: 'DMARC',
    hideState: true,
    records: [
        { dnsType: 'TXT', value: 'v=spf1 ...', state: 'valid' }, // blank host
        { dnsType: 'TXT', value: 'v=DMARC1; p=quarantine', host: '_dmarc', state: 'valid' },
    ],
};

describe('DNSGroupRecords host name', () => {
    it('shows the default value for a blank host and the base host untouched when there is no subdomain', () => {
        easySwitchRender(<DNSGroupRecords group={group} />);

        expect(screen.getByText(/Use default value/)).toBeInTheDocument();
        expect(screen.getByText('_dmarc')).toBeInTheDocument();
        expect(screen.queryByText(/\.mail$/)).not.toBeInTheDocument();
    });

    it('prepends the subdomain to every record host when the domain has a subdomain', () => {
        easySwitchRender(<DNSGroupRecords group={group} subdomain="mail" />);

        // blank host becomes the subdomain itself
        expect(screen.getByText('mail')).toBeInTheDocument();
        // non-empty host gets the subdomain appended
        expect(screen.getByText('_dmarc.mail')).toBeInTheDocument();
        // and the raw base host is no longer shown on its own
        expect(screen.queryByText('_dmarc')).not.toBeInTheDocument();
        expect(screen.queryByText(/Use default value/)).not.toBeInTheDocument();
    });
});
