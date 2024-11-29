import { VPN_HOSTNAME } from '../../lib/constants';
import { isProduction } from '../../lib/helpers/sentry';

describe('isProduction', () => {
    it('should recognize production subdomains', () => {
        expect(isProduction('account.proton.me')).toEqual(true);
        expect(isProduction('mail.proton.me')).toEqual(true);
        expect(isProduction('drive.proton.me')).toEqual(true);
        expect(isProduction('pass.proton.me')).toEqual(true);
        expect(isProduction('wallet.proton.me')).toEqual(true);
        expect(isProduction(VPN_HOSTNAME)).toEqual(true);
        expect(isProduction('account.protonvpn.com')).toEqual(true);
        expect(isProduction('join.protonvpn.com')).toEqual(true);
    });
});
