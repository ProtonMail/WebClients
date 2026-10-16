import { isInternalLumoHost } from './internalHost';

describe('isInternalLumoHost', () => {
    it.each(['lumo.proton.dev', 'lumo.proton.black', 'lumo.eamonn.proton.black', 'lumo.feature-x.proton.black'])(
        'accepts %s',
        (hostname) => {
            expect(isInternalLumoHost(hostname)).toBe(true);
        }
    );

    it.each([
        'lumo.proton.me',
        'proton.dev',
        'mail.proton.dev',
        'mail.proton.black',
        'lumo.proton.black.evil.com',
        'evillumo.proton.black',
        'localhost',
    ])('rejects %s', (hostname) => {
        expect(isInternalLumoHost(hostname)).toBe(false);
    });
});
