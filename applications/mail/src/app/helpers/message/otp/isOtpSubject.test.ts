import { isOtpSubject } from './isOtpSubject';

describe('isOtpSubject', () => {
    // Ported regression suite — see otp PORTING notes §7.
    describe('classifies OTP subjects as true', () => {
        it.each([
            '937326 is your verification code',
            'Your code is 531631',
            'Votre code de connexion Spotify : 347432',
            "Here's your code",
            'Here’s your code', // curly apostrophe variant
            'Tu código de inicio de sesión es 123456',
            'Your auth code',
            'Your MFA Code',
            '443805 – dein Spotify Anmeldecode',
            'Your code is: QCVDRM', // letter-only code via "your code is"
            'Bestätigungs-Code für Slack: 123456', // hyphen
            // bucket A keyword variants
            "Votre code d'authentification",
            'Votre code d’authentification', // curly apostrophe
            'Votre code de double authentification',
            'Votre code de validation Orange',
            'Votre code à 6 chiffres afin de vous connecter',
            'votre mot de passe à usage unique',
            'Tu código de autenticación',
            'Code zum Anmelden bei Zoom',
            'Code zur Bestätigung Ihrer E-Mail-Adresse',
            'Ihr Einmal-Kennwort', // hyphen
            'Código único do Indeed',
            '123456 é o teu código de reposição da palavra-passe',
            // bucket D passcode / access
            'Your security passcode',
            'Your Verification Passcode',
            'Your one-time-passcode',
            'Your MILKRUN Passcode',
            'Passcode is 123456',
            'Your American Express One-Time Access Code',
            'Your Netflix temporary access code',
        ])('%s', (subject) => {
            expect(isOtpSubject(subject)).toBe(true);
        });
    });

    describe('classifies non-OTP subjects as false', () => {
        it.each([
            '[GitHub] Please download your two-factor recovery codes', // codes / download veto
            '🍻 -20% sur votre prochaine commande ! Code : HOLIDAYS', // promo veto
            'New sign-in to your account', // alert, not a delivery
            'Use code: TRANSFER', // possessive but no digit token
            "⏰ Don't wait! Your Super Cash code EXPIRES SOON", // substring, not whole-subject allowlist
            'A Secret QR Code Is Hiding in Your iPhone', // "code is" without possessive "your"
        ])('%s', (subject) => {
            expect(isOtpSubject(subject)).toBe(false);
        });
    });

    describe('brand-in-sender', () => {
        it('matches when the captured brand is in the sender address', () => {
            expect(isOtpSubject('Your Spotify code', 'no-reply@spotify.com')).toBe(true);
            expect(isOtpSubject('Votre code Decathlon', 'noreply@decathlon.fr')).toBe(true);
        });

        it('does not match when the brand is absent from the sender', () => {
            expect(isOtpSubject('Your Spotify code', 'security@acme.com')).toBe(false);
        });

        it('is inert without a sender', () => {
            expect(isOtpSubject('Your Spotify code')).toBe(false);
        });
    });
});
