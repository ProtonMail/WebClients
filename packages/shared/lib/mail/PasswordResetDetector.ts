export interface DetectionResult {
    isReset: boolean;
    confidence: number;
}

/**
 * Detects if an email is a password reset email
 * @returns {DetectionResult} {isReset: boolean, confidence: number}
 *
 * ### Example Usage:
 * ```typescript
 * import PasswordResetDetector from '@proton/shared/lib/mail/PasswordResetDetector';
 * const result = PasswordResetDetector.isPasswordResetEmail('Reset your password');
 * console.log(result);
 * // Output: { isReset: true, confidence: 1.0 }
 * ```
 *
 * ### Description:
 * This class uses regular expressions to detect if an email is a password reset email.
 *  Weights are assigned to each of the pre-existing patterns.
 *  The confidence is the maximum weight of the patterns that match the email subject.
 *  If the confidence is greater than or equal to the confidence threshold, the email is considered a password reset email.
 */
class PasswordResetDetector {
    private readonly CONFIDENCE_THRESHOLD = 0.6;

    private resetKeywords: Record<string, { regex: RegExp; weight: number }[]> = {
        EN: [
            // High confidence patterns
            { regex: /\b(?:password|pwd)\b.*\breset\b/i, weight: 1.0 },
            { regex: /\breset\b.*\b(?:password|pwd)\b/i, weight: 1.0 },
            { regex: /\bforgot\b.*\b(?:password|pwd)\b/i, weight: 1.0 },
            // Medium confidence patterns
            { regex: /\brecover\b.*\b(?:password|pwd)\b/i, weight: 0.8 },
            { regex: /\bchange\b.*\b(?:password|pwd)\b/i, weight: 0.7 },
            // Lower confidence patterns
            { regex: /\baccount\b.*\brecovery\b(?!.*\btips\b)/i, weight: 0.6 },
            { regex: /\brecover\b.*\baccount\b/i, weight: 0.6 },
            { regex: /\b(?:password|pwd)\b.*\bassistance\b(?!.*\brequired\b)/i, weight: 0.5 },
        ],
        DE: [
            { regex: /(?:passwort|kennwort).*zurücksetzen/i, weight: 1.0 },
            { regex: /zurücksetzen.*(?:passwort|kennwort)/i, weight: 1.0 },
            { regex: /(?:passwort|kennwort).*vergessen/i, weight: 1.0 },
            { regex: /(?:passwort|kennwort).*ändern/i, weight: 0.7 },
            { regex: /konto.*wiederherstellen/i, weight: 0.6 },
            { regex: /konten.*wiederherstell/i, weight: 0.6 },
            { regex: /wiederherstellung/i, weight: 0.6 },
        ],
        FR: [
            { regex: /réinitialisation.*mot.*de.*passe/i, weight: 1.0 },
            { regex: /réinitialisez.*mot.*de.*passe/i, weight: 1.0 },
            { regex: /réinitialiser.*mot.*de.*passe/i, weight: 1.0 },
            { regex: /récupération.*mot.*de.*passe/i, weight: 1.0 },
            { regex: /mot.*de.*passe.*oublié.*/i, weight: 1.0 },
            { regex: /avez-vous.*oublié.*mot.*de.*passe.*/i, weight: 1.0 },
            { regex: /modifier.*mot.*de.*passe/i, weight: 0.7 },
            { regex: /changer.*mot.*de.*passe/i, weight: 0.7 },
            { regex: /récupérer.*compte/i, weight: 0.6 },
            { regex: /récupération.*compte/i, weight: 0.6 },
            { regex: /assistance.*mot.*de.*passe/i, weight: 0.5 },
            { regex: /réinitialisation.*demandée/i, weight: 0.5 },
        ],
        IT: [
            { regex: /resetta.*(?:la.*)?(?:tua.*)?password/i, weight: 1.0 },
            { regex: /reimpostazione.*(?:la.*)?password/i, weight: 1.0 },
            { regex: /reimposta.*(?:la.*)?tua.*password/i, weight: 1.0 },
            { regex: /reimpostare.*(?:la.*)?tua.*password/i, weight: 1.0 },
            { regex: /recupero.*password/i, weight: 1.0 },
            { regex: /hai.*dimenticato.*(?:la.*)?tua.*password/i, weight: 1.0 },
            { regex: /password.*dimenticata/i, weight: 1.0 },
            { regex: /cambia.*(?:la.*)?tua.*password/i, weight: 0.7 },
            { regex: /modifica.*(?:la.*)?tua.*password/i, weight: 0.7 },
            { regex: /recupera.*(?:il.*)?tuo.*account/i, weight: 0.6 },
            { regex: /recupero.*del.*tuo.*account/i, weight: 0.6 },
            { regex: /assistenza.*password/i, weight: 0.5 },
            { regex: /reimpostazione.*richiesta/i, weight: 0.5 },
        ],
        ES: [
            { regex: /restablecimiento.*(?:de.*)?(?:la.*)?contraseña/i, weight: 1.0 },
            { regex: /restablecer.*(?:la.*)?contraseña/i, weight: 1.0 },
            { regex: /restablece.*(?:tu.*)?contraseña/i, weight: 1.0 },
            { regex: /recuperación.*(?:de.*)?(?:la.*)?contraseña/i, weight: 1.0 },
            { regex: /recuperar.*(?:la.*)?contraseña/i, weight: 1.0 },
            { regex: /(?:¿)?olvidaste.*(?:tu.*)?contraseña/i, weight: 1.0 },
            { regex: /olvidó.*(?:su.*)?contraseña/i, weight: 1.0 },
            { regex: /cambia.*(?:tu.*)?contraseña/i, weight: 0.7 },
            { regex: /cambiar.*(?:la.*)?contraseña/i, weight: 0.7 },
            { regex: /recupera.*(?:tu.*)?cuenta/i, weight: 0.6 },
            { regex: /recuperar.*cuenta/i, weight: 0.6 },
            { regex: /asistencia.*contraseña/i, weight: 0.5 },
            { regex: /restablecimiento.*solicitado/i, weight: 0.5 },
        ],
    };

    /**
     * Detects if an email is a password reset email
     * @param {string} subject - The subject of the email
     * @returns {DetectionResult} {isReset: boolean, confidence: number}
     */
    isPasswordResetEmail(subject: string): DetectionResult {
        const normalizedSubject = subject.trim();
        let maxConfidence = 0;

        for (const [, patterns] of Object.entries(this.resetKeywords)) {
            for (const { regex, weight } of patterns) {
                if (regex.test(normalizedSubject)) {
                    maxConfidence = Math.max(maxConfidence, weight);
                    // Early break if we find a match above threshold
                    if (maxConfidence >= this.CONFIDENCE_THRESHOLD) {
                        break;
                    }
                }
            }

            // Early break from outer loop if we've found a match above threshold
            if (maxConfidence >= this.CONFIDENCE_THRESHOLD) {
                break;
            }
        }

        return {
            isReset: maxConfidence >= this.CONFIDENCE_THRESHOLD,
            confidence: maxConfidence,
        };
    }

    // Helper method to add new patterns
    addPattern(language: string, pattern: string, weight: number): void {
        if (!this.resetKeywords[language]) {
            this.resetKeywords[language] = [];
        }
        this.resetKeywords[language].push({ regex: new RegExp(pattern, 'i'), weight });
    }
}

/* Export a singleton instance of the PasswordResetDetector */
export default new PasswordResetDetector();
