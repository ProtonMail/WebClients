import { ADDRESS_STATUS } from '../../lib/constants';
import type { DomainAddress } from '../../lib/interfaces/Address';
import type { Domain } from '../../lib/interfaces/Domain';
import { DOMAIN_STATE, MX_STATE } from '../../lib/interfaces/Domain';
import { getHasAddressMissingProtonMX, getIsDomainMxScanNeeded } from '../../lib/organization/domain';

const buildDomain = ({
    State = DOMAIN_STATE.DOMAIN_STATE_VERIFIED,
    MxState = MX_STATE.MX_STATE_NO_US,
    mailIntent = true,
}: {
    State?: DOMAIN_STATE;
    MxState?: MX_STATE;
    mailIntent?: boolean;
}) => ({ State, MxState, Flags: { 'mail-intent': mailIntent } }) as Domain;

const buildAddress = (Status: ADDRESS_STATUS, ProtonMX: boolean) => ({ Status, ProtonMX }) as DomainAddress;

describe('getIsDomainMxScanNeeded', () => {
    it.each([MX_STATE.MX_STATE_DEFAULT, MX_STATE.MX_STATE_NO_US, MX_STATE.MX_STATE_INC_US, MX_STATE.MX_STATE_BACKUP])(
        'returns true for an active domain with MX state %s',
        (MxState) => {
            expect(getIsDomainMxScanNeeded(buildDomain({ MxState }))).toBe(true);
        }
    );

    it('returns true for an active domain in warning state', () => {
        expect(getIsDomainMxScanNeeded(buildDomain({ State: DOMAIN_STATE.DOMAIN_STATE_WARN }))).toBe(true);
    });

    it('returns false when the MX state is good', () => {
        expect(getIsDomainMxScanNeeded(buildDomain({ MxState: MX_STATE.MX_STATE_GOOD }))).toBe(false);
    });

    it('returns false when the domain is not verified', () => {
        expect(getIsDomainMxScanNeeded(buildDomain({ State: DOMAIN_STATE.DOMAIN_STATE_DEFAULT }))).toBe(false);
    });

    it('returns false when the domain is not meant for mail', () => {
        expect(getIsDomainMxScanNeeded(buildDomain({ mailIntent: false }))).toBe(false);
    });
});

describe('getHasAddressMissingProtonMX', () => {
    it('returns false for no addresses', () => {
        expect(getHasAddressMissingProtonMX([])).toBe(false);
    });

    it('returns true when an enabled address misses Proton MX', () => {
        expect(
            getHasAddressMissingProtonMX([
                buildAddress(ADDRESS_STATUS.STATUS_ENABLED, true),
                buildAddress(ADDRESS_STATUS.STATUS_ENABLED, false),
            ])
        ).toBe(true);
    });

    it('returns false when every enabled address has Proton MX', () => {
        expect(getHasAddressMissingProtonMX([buildAddress(ADDRESS_STATUS.STATUS_ENABLED, true)])).toBe(false);
    });

    it.each([ADDRESS_STATUS.STATUS_DISABLED, ADDRESS_STATUS.STATUS_DELETING])(
        'ignores an address in status %s missing Proton MX',
        (Status) => {
            expect(getHasAddressMissingProtonMX([buildAddress(Status, false)])).toBe(false);
        }
    );
});
