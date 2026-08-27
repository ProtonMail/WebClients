import type { DetectionResult } from '../../lib/mail/PasswordResetDetector';
import PasswordResetMailDetector from '../../lib/mail/PasswordResetDetector';

interface TestCase {
    subject: string;
    expected: {
        isReset: boolean;
        minConfidence: number;
    };
}

describe('PasswordResetDetector', () => {
    describe('isPasswordResetEmail', () => {
        const testCases: TestCase[] = [
            // English test cases
            {
                subject: 'Password Reset Request',
                expected: { isReset: true, minConfidence: 1.0 },
            },
            {
                subject: 'Account Recovery',
                expected: { isReset: true, minConfidence: 0.6 },
            },
            {
                subject: 'Reset Your Password',
                expected: { isReset: true, minConfidence: 1.0 },
            },
            {
                subject: 'Forgot Your Password?',
                expected: { isReset: true, minConfidence: 1.0 },
            },
            {
                subject: 'Secure Your Account',
                expected: { isReset: false, minConfidence: 0 },
            },
            {
                subject: 'Password Assistance Required',
                expected: { isReset: false, minConfidence: 0 },
            },
            {
                subject: 'Recover Your Account',
                expected: { isReset: true, minConfidence: 0.6 },
            },
            {
                subject: 'Reset Password Instructions',
                expected: { isReset: true, minConfidence: 1.0 },
            },
            {
                subject: 'Verify Your Identity',
                expected: { isReset: false, minConfidence: 0 },
            },
            {
                subject: 'Account Security Alert',
                expected: { isReset: false, minConfidence: 0 },
            },

            // German test cases
            {
                subject: 'Passwort zurücksetzen',
                expected: { isReset: true, minConfidence: 1.0 },
            },
            {
                subject: 'Kennwort zurücksetzen',
                expected: { isReset: true, minConfidence: 1.0 },
            },
            {
                subject: 'Kennwort vergessen?',
                expected: { isReset: true, minConfidence: 1.0 },
            },
            {
                subject: 'Kennwort ändern',
                expected: { isReset: true, minConfidence: 0.7 },
            },
            {
                subject: 'Kontenwiederherstellung',
                expected: { isReset: true, minConfidence: 0.6 },
            },
            {
                subject: 'Sichere dein Konto',
                expected: { isReset: false, minConfidence: 0 },
            },
            {
                subject: 'Passworthilfe erforderlich',
                expected: { isReset: false, minConfidence: 0 },
            },
            {
                subject: 'Konto wiederherstellen',
                expected: { isReset: true, minConfidence: 0.6 },
            },
            {
                subject: 'Anweisungen zum Zurücksetzen des Passworts',
                expected: { isReset: true, minConfidence: 1.0 },
            },

            // French test cases
            {
                subject: 'Réinitialisation du mot de passe',
                expected: { isReset: true, minConfidence: 1.0 },
            },
            {
                subject: 'Récupération de compte',
                expected: { isReset: true, minConfidence: 0.6 },
            },
            {
                subject: 'Mot de passe oublié?',
                expected: { isReset: true, minConfidence: 1.0 },
            },
            {
                subject: 'Sécurisez votre compte',
                expected: { isReset: false, minConfidence: 0 },
            },
            {
                subject: 'Aide pour le mot de passe',
                expected: { isReset: false, minConfidence: 0 },
            },

            // Italian test cases
            {
                subject: 'Resetta la tua password',
                expected: { isReset: true, minConfidence: 1.0 },
            },
            {
                subject: 'Password dimenticata?',
                expected: { isReset: true, minConfidence: 1.0 },
            },
            {
                subject: 'Recupera il tuo account',
                expected: { isReset: true, minConfidence: 0.6 },
            },
            {
                subject: 'Proteggi il tuo account',
                expected: { isReset: false, minConfidence: 0 },
            },

            // Spanish test cases
            {
                subject: 'Restablecer tu contraseña',
                expected: { isReset: true, minConfidence: 1.0 },
            },
            {
                subject: '¿Olvidaste tu contraseña?',
                expected: { isReset: true, minConfidence: 1.0 },
            },
            {
                subject: 'Recupera tu cuenta',
                expected: { isReset: true, minConfidence: 0.6 },
            },
            {
                subject: 'Protege tu cuenta',
                expected: { isReset: false, minConfidence: 0 },
            },

            // Negative test cases - Regular notification emails
            {
                subject: 'Your Daily Newsletter',
                expected: { isReset: false, minConfidence: 0 },
            },
            {
                subject: 'Weekly Account Summary',
                expected: { isReset: false, minConfidence: 0 },
            },
            {
                subject: 'Your Order Confirmation',
                expected: { isReset: false, minConfidence: 0 },
            },

            // Negative test cases - Security-related but not password reset
            {
                subject: 'Security Alert: New Login Detected',
                expected: { isReset: false, minConfidence: 0 },
            },
            {
                subject: 'Two-Factor Authentication Code',
                expected: { isReset: false, minConfidence: 0 },
            },
            {
                subject: 'Important: Update Your Security Settings',
                expected: { isReset: false, minConfidence: 0 },
            },

            // Negative test cases - Account-related but not password reset
            {
                subject: 'Welcome to Your New Account',
                expected: { isReset: false, minConfidence: 0 },
            },
            {
                subject: 'Account Status Update',
                expected: { isReset: false, minConfidence: 0 },
            },
            {
                subject: 'Your Account Settings Have Changed',
                expected: { isReset: false, minConfidence: 0 },
            },

            // Negative test cases - Similar-looking but unrelated subjects
            {
                subject: 'Password Manager Subscription',
                expected: { isReset: false, minConfidence: 0 },
            },
            {
                subject: 'Reset Your Preferences',
                expected: { isReset: false, minConfidence: 0 },
            },
            {
                subject: 'Account Recovery Tips',
                expected: { isReset: false, minConfidence: 0 },
            },

            // Negative test cases - Multi-language subjects that shouldn't trigger
            {
                subject: 'Password Tips und Sicherheit',
                expected: { isReset: false, minConfidence: 0 },
            },
            {
                subject: 'Secure mot de passe guidelines',
                expected: { isReset: false, minConfidence: 0 },
            },
            {
                subject: 'Your contraseña strength report',
                expected: { isReset: false, minConfidence: 0 },
            },
        ];

        testCases.forEach(({ subject, expected }: TestCase) => {
            it(`correctly detects "${subject}"`, () => {
                const result: DetectionResult = PasswordResetMailDetector.isPasswordResetEmail(subject);
                expect(result.isReset).toBe(expected.isReset);
                if (expected.isReset) {
                    expect(result.confidence).toBeGreaterThanOrEqual(expected.minConfidence);
                } else {
                    expect(result.confidence).toBe(expected.minConfidence);
                }
            });
        });

        it('handles multiple language matches', () => {
            const mixedSubject = 'reset password change contraseña';
            const result: DetectionResult = PasswordResetMailDetector.isPasswordResetEmail(mixedSubject);
            expect(result.isReset).toBe(true);
            expect(result.confidence).toBeGreaterThan(0.6);
        });
    });
});
