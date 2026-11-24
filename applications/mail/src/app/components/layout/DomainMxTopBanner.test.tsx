import { screen } from '@testing-library/react';

import type { DomainsState } from '@proton/account/domains';
import { getModelState } from '@proton/account/testing/getModelState';
import DomainMxTopBanner from '@proton/components/containers/topBanners/DomainMxTopBanner';
import { ADDRESS_STATUS } from '@proton/shared/lib/constants';
import type { DomainAddress } from '@proton/shared/lib/interfaces/Address';
import type { Domain } from '@proton/shared/lib/interfaces/Domain';
import { DOMAIN_STATE, MX_STATE } from '@proton/shared/lib/interfaces/Domain';
import { useFlag } from '@proton/unleash/useFlag';

import { addApiMock, api, clearApiMocks } from '../../helpers/tests/api';
import { mailTestRender } from '../../helpers/tests/render';

jest.mock('@proton/unleash/useFlag');
const mockUseFlag = jest.mocked(useFlag);

const domainMissingProtonMX = {
    ID: 'domain-id',
    DomainName: 'example.com',
    State: DOMAIN_STATE.DOMAIN_STATE_VERIFIED,
    MxState: MX_STATE.MX_STATE_NO_US,
    Flags: { 'mail-intent': true },
} as Domain;

const getDomainsState = (domains: Domain[]) => getModelState(domains) as DomainsState['domains'];

// Passed as `onStore` so it replaces the generic features mock `mailTestRender` registers just before.
const respondWithoutSkipFeature = () => addApiMock('core/v4/features', () => ({ Features: [] }), 'get');

describe('DomainMxTopBanner in the Mail store', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockUseFlag.mockReturnValue(true);
    });

    afterEach(() => {
        clearApiMocks();
    });

    it('loads the domain addresses and shows the banner for an admin while the skip feature is missing', async () => {
        const addresses = [{ Status: ADDRESS_STATUS.STATUS_ENABLED, ProtonMX: false }] as DomainAddress[];
        addApiMock(`domains/${domainMissingProtonMX.ID}/addresses`, () => ({ Addresses: addresses, Total: 1 }));

        await mailTestRender(<DomainMxTopBanner />, {
            preloadedState: { domains: getDomainsState([domainMissingProtonMX]) },
            onStore: respondWithoutSkipFeature,
        });

        expect(
            await screen.findByText(/Activate Proton Mail to start receiving emails at example\.com\./)
        ).toBeInTheDocument();
    });

    it('renders nothing for a member without custom domains', async () => {
        await mailTestRender(<DomainMxTopBanner />, {
            preloadedState: { domains: getDomainsState([]) },
        });

        expect(screen.queryByText(/start receiving emails at/)).not.toBeInTheDocument();
        expect(api).not.toHaveBeenCalledWith(expect.objectContaining({ url: expect.stringMatching(/^domains/) }));
    });
});
