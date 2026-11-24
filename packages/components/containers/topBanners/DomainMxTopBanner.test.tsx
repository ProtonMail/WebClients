import { act, fireEvent, screen } from '@testing-library/react';
import type { MockedFunction } from 'vitest';

import { useCustomDomains } from '@proton/account/domains/hooks';
import { useDomainsAddresses } from '@proton/account/domainsAddresses/hooks';
import { FeatureCode } from '@proton/features/interface';
import { ADDRESS_STATUS } from '@proton/shared/lib/constants';
import type { DomainAddress } from '@proton/shared/lib/interfaces/Address';
import type { Domain } from '@proton/shared/lib/interfaces/Domain';
import { DOMAIN_STATE, MX_STATE } from '@proton/shared/lib/interfaces/Domain';
import { flushPromises } from '@proton/test-api/flush-promises';
import { addApiMock, apiMock, clearApiMocks } from '@proton/test-api/vitest/api';
import { useFlag } from '@proton/unleash/useFlag';

import { renderWithProviders } from '../../testing/renderWithProviders';
import DomainMxTopBanner from './DomainMxTopBanner';

vi.mock('@proton/unleash/useFlag');
vi.mock('@proton/account/domains/hooks');
vi.mock('@proton/account/domainsAddresses/hooks');

const mockUseFlag = useFlag as MockedFunction<typeof useFlag>;
const mockUseCustomDomains = useCustomDomains as MockedFunction<typeof useCustomDomains>;
const mockUseDomainsAddresses = useDomainsAddresses as MockedFunction<typeof useDomainsAddresses>;

const skipFeatureValueUrl = `core/v4/features/${FeatureCode.MailSkipMissingDomainMX}/value`;

const buildDomain = (ID: string, overrides: Partial<Domain> = {}) =>
    ({
        ID,
        DomainName: `${ID}.com`,
        State: DOMAIN_STATE.DOMAIN_STATE_VERIFIED,
        MxState: MX_STATE.MX_STATE_NO_US,
        Flags: { 'mail-intent': true },
        ...overrides,
    }) as Domain;

const enabledAddress = (ProtonMX: boolean) => ({ Status: ADDRESS_STATUS.STATUS_ENABLED, ProtonMX }) as DomainAddress;

const respondWithSkippedDomainIDs = (skippedDomainIDs: string[]) => {
    addApiMock(
        'core/v4/features',
        () => ({ Features: [{ Code: FeatureCode.MailSkipMissingDomainMX, Value: skippedDomainIDs }] }),
        'get'
    );
};

const setup = async ({
    domains,
    addressesByDomainID,
    loading = false,
}: {
    domains: Domain[];
    addressesByDomainID: Record<string, DomainAddress[]>;
    loading?: boolean;
}) => {
    mockUseCustomDomains.mockReturnValue([domains, false]);
    mockUseDomainsAddresses.mockReturnValue([addressesByDomainID, loading]);
    const result = renderWithProviders(<DomainMxTopBanner />);
    await act(flushPromises);
    return result;
};

const openHideModal = async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Close this banner' }));
    expect(await screen.findByText('Hide this reminder?')).toBeInTheDocument();
};

describe('DomainMxTopBanner', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockUseFlag.mockReturnValue(true);
        respondWithSkippedDomainIDs([]);
    });

    afterEach(() => {
        clearApiMocks();
    });

    it('names the single domain missing Proton MX and links to the domain names settings', async () => {
        await setup({
            domains: [buildDomain('bad'), buildDomain('fine')],
            addressesByDomainID: { bad: [enabledAddress(false)], fine: [enabledAddress(true)] },
        });

        expect(screen.getByText(/Activate Proton Mail to start receiving emails at bad\.com\./)).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'Activate' })).toHaveAttribute(
            'href',
            expect.stringMatching(/\/domain-names$/)
        );
    });

    it('counts the domains when several miss Proton MX', async () => {
        await setup({
            domains: [buildDomain('first'), buildDomain('second')],
            addressesByDomainID: { first: [enabledAddress(false)], second: [enabledAddress(false)] },
        });

        expect(
            screen.getByText(/Activate Proton Mail to start receiving emails at 2 of your domains\./)
        ).toBeInTheDocument();
    });

    it('renders nothing when no domain has an address missing Proton MX', async () => {
        const { container } = await setup({
            domains: [buildDomain('fine')],
            addressesByDomainID: { fine: [enabledAddress(true)] },
        });

        expect(container).toBeEmptyDOMElement();
    });

    it('renders nothing while the domain addresses load', async () => {
        const { container } = await setup({
            domains: [buildDomain('bad')],
            addressesByDomainID: { bad: [enabledAddress(false)] },
            loading: true,
        });

        expect(container).toBeEmptyDOMElement();
    });

    it('renders nothing and loads no domains when the flag is off', async () => {
        mockUseFlag.mockReturnValue(false);

        const { container } = await setup({
            domains: [buildDomain('bad')],
            addressesByDomainID: { bad: [enabledAddress(false)] },
        });

        expect(mockUseFlag).toHaveBeenCalledWith('MailDomainMxTopBanner');
        expect(container).toBeEmptyDOMElement();
        expect(mockUseCustomDomains).not.toHaveBeenCalled();
        expect(mockUseDomainsAddresses).not.toHaveBeenCalled();
    });

    it('only loads addresses of active domains whose MX is not good', async () => {
        const scanned = buildDomain('scanned');
        await setup({
            domains: [
                scanned,
                buildDomain('good', { MxState: MX_STATE.MX_STATE_GOOD }),
                buildDomain('inactive', { State: DOMAIN_STATE.DOMAIN_STATE_DEFAULT }),
            ],
            addressesByDomainID: {},
        });

        expect(mockUseDomainsAddresses).toHaveBeenLastCalledWith([scanned]);
    });

    it('never loads addresses of a skipped domain', async () => {
        const skipped = buildDomain('skipped');
        const other = buildDomain('other');
        respondWithSkippedDomainIDs([skipped.ID]);

        await setup({ domains: [skipped, other], addressesByDomainID: {} });

        expect(mockUseDomainsAddresses).toHaveBeenLastCalledWith([other]);
        expect(mockUseDomainsAddresses).not.toHaveBeenCalledWith(expect.arrayContaining([skipped]));
    });

    it.each([
        ['is missing on the backend', () => addApiMock('core/v4/features', () => ({ Features: [] }), 'get')],
        [
            'cannot be read',
            () =>
                addApiMock(
                    'core/v4/features',
                    () => {
                        throw new Error('Feature read failed');
                    },
                    'get'
                ),
        ],
    ])('still shows the banner when the skip feature %s', async (_, respond) => {
        respond();

        await setup({ domains: [buildDomain('bad')], addressesByDomainID: { bad: [enabledAddress(false)] } });

        expect(screen.getByText(/start receiving emails at bad\.com\./)).toBeInTheDocument();
    });

    it('writes nothing when the hide confirmation is cancelled', async () => {
        await setup({ domains: [buildDomain('bad')], addressesByDomainID: { bad: [enabledAddress(false)] } });

        await openHideModal();
        fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
        await act(flushPromises);

        expect(apiMock).not.toHaveBeenCalledWith(expect.objectContaining({ url: skipFeatureValueUrl }));
        expect(screen.getByText(/start receiving emails at bad\.com\./)).toBeInTheDocument();
    });

    it('skips every listed domain on top of the stored ones and hides the banner once confirmed', async () => {
        respondWithSkippedDomainIDs(['already-skipped']);
        addApiMock(skipFeatureValueUrl, ({ data }) => ({ Feature: { Value: data.Value } }), 'put');

        await setup({
            domains: [buildDomain('first'), buildDomain('second')],
            addressesByDomainID: { first: [enabledAddress(false)], second: [enabledAddress(false)] },
        });

        await openHideModal();
        fireEvent.click(screen.getByRole('button', { name: 'Hide' }));
        await act(flushPromises);

        const skipWrites = apiMock.mock.calls.filter(([args]) => args.url === skipFeatureValueUrl);
        expect(skipWrites).toEqual([
            [expect.objectContaining({ method: 'put', data: { Value: ['already-skipped', 'first', 'second'] } })],
        ]);
        expect(screen.queryByText(/start receiving emails at/)).not.toBeInTheDocument();
    });
});
