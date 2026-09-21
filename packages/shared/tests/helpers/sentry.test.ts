import { redactSensitiveString } from '../../lib/helpers/sentry';

describe('redactSensitiveString()', () => {
    it('redacts anything after a hash', () => {
        expect(redactSensitiveString('https://drive.proton.me/urls/TBYS1295RG#s3cr3t-p4ssw0rd')).toBe(
            'https://drive.proton.me/urls/TBYS1295RG#[Filtered]'
        );
    });

    it('redacts anything after an encoded hash', () => {
        expect(redactSensitiveString('GET https://drive.proton.me/urls/TBYS1295RG%23s3cr3t')).toBe(
            'GET https://drive.proton.me/urls/TBYS1295RG#[Filtered]'
        );
    });

    it('redacts email query parameters', () => {
        expect(redactSensitiveString('https://account.proton.me/api/keys/all?email=someone@example.com&Page=0')).toBe(
            'https://account.proton.me/api/keys/all?email=[Filtered]&Page=0'
        );
    });

    it('redacts every email query parameter', () => {
        expect(redactSensitiveString('?email=a@b.com&x=1&Email=c@d.com')).toBe(
            '?email=[Filtered]&x=1&email=[Filtered]'
        );
    });

    it('leaves strings without anything sensitive alone', () => {
        expect(redactSensitiveString('GET https://drive.proton.me/api/drive/volumes')).toBe(
            'GET https://drive.proton.me/api/drive/volumes'
        );
    });

    it('can keep a hash, for DOM selectors', () => {
        expect(redactSensitiveString('div#root > button.toolbar-button', { redactFragment: false })).toBe(
            'div#root > button.toolbar-button'
        );
    });
});
