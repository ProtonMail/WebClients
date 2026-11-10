import { screen } from '@testing-library/react';

import { ZONE_APEX } from '@proton/shared/lib/domains/constants';
import { DnsRecordType } from '@proton/shared/lib/domains/dnsRecords';

import { easySwitchRender } from '../../../tests/render';
import DNSGroupRecords, { type DNSGroup } from './DNSGroupRecords';

const getGroup = (hostname: string): DNSGroup => ({
    name: 'DMARC',
    hideState: true,
    records: [{ type: DnsRecordType.TXT, hostname, value: 'v=DMARC1; p=quarantine', state: 'valid' }],
});

describe('DNSGroupRecords host name', () => {
    it('shows the default value placeholder without a host copy button for the zone apex', () => {
        easySwitchRender(<DNSGroupRecords group={getGroup(ZONE_APEX)} />);

        expect(screen.getByText(/Use default value/)).toBeInTheDocument();
        expect(screen.queryByText(ZONE_APEX)).not.toBeInTheDocument();
        expect(screen.getAllByRole('button', { name: 'Copy' })).toHaveLength(1);
    });

    it('shows any other hostname verbatim with a copy button', () => {
        easySwitchRender(<DNSGroupRecords group={getGroup('_dmarc.mail')} />);

        expect(screen.getByText('_dmarc.mail')).toBeInTheDocument();
        expect(screen.queryByText(/Use default value/)).not.toBeInTheDocument();
        expect(screen.getAllByRole('button', { name: 'Copy' })).toHaveLength(2);
    });
});
