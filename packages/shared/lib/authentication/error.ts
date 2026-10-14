import { c } from 'ttag';

export class InvalidPersistentSessionError extends Error {
    constructor(message?: string) {
        super(['Invalid persistent session', message].filter(Boolean).join(':'));
        Object.setPrototypeOf(this, InvalidPersistentSessionError.prototype);
    }
}

export class InvalidForkConsumeError extends Error {
    constructor(message?: string) {
        super(['Invalid fork consumption', message].filter(Boolean).join(':'));
        Object.setPrototypeOf(this, InvalidForkConsumeError.prototype);
    }
}

/** A wrong second factor code (TOTP or backup code); callers let the user try again. Its message is the API's. */
export class TOTPError extends Error {
    name = 'TOTPError';

    trace = false;

    constructor(message: string) {
        super(message);
        Object.setPrototypeOf(this, TOTPError.prototype);
    }
}

/** A wrong email or SMS verification code; callers let the user try again. Its message is the API's. */
export class InvalidCodeError extends Error {
    name = 'InvalidCodeError';

    trace = false;

    constructor(message: string) {
        super(message);
        Object.setPrototypeOf(this, InvalidCodeError.prototype);
    }
}

/**
 * A wrong recovery phrase; callers let the user try again. Its message is the one the recovery phrase form shows when
 * the words themselves are wrong (`useMnemonicInputValidation`), so the user reads the same either way. Keeps what
 * refused the phrase as the cause.
 */
export class InvalidRecoveryPhraseError extends Error {
    name = 'InvalidRecoveryPhraseError';

    trace = false;

    constructor(cause?: unknown) {
        // Not the API's message ("Invalid recovery phrase. Please try again"), unlike other errors the API decides: the
        // form refuses a phrase whose words are wrong with this one, and users can't tell which check refused theirs,
        // so a wrong phrase reads the same whichever did
        super(c('Error').t`Wrong recovery phrase. Try again or use another recovery method.`, { cause });
        Object.setPrototypeOf(this, InvalidRecoveryPhraseError.prototype);
    }
}

/** A wrong password for the keys (the second password or the SSO backup password); callers let the user try again. */
export class PasswordError extends Error {
    name = 'PasswordError';

    trace = false;

    constructor(message: string) {
        super(message);
        Object.setPrototypeOf(this, PasswordError.prototype);
    }
}

/** A wrong second password: the keys didn't unlock with it. */
export class SecondPasswordError extends PasswordError {
    constructor() {
        super(c('Error').t`Incorrect second password. Please try again.`);
        Object.setPrototypeOf(this, SecondPasswordError.prototype);
    }
}

/** A wrong SSO backup password: the keys didn't unlock with it. */
export class BackupPasswordError extends PasswordError {
    constructor() {
        super(c('Error').t`Incorrect backup password. Please try again.`);
        Object.setPrototypeOf(this, BackupPasswordError.prototype);
    }
}

/** A wrong current password, on a member's first SSO sign-in after the organization converted them to SSO. */
export class ConversionPasswordError extends PasswordError {
    constructor() {
        super(c('Error').t`Incorrect password. Please try again.`);
        Object.setPrototypeOf(this, ConversionPasswordError.prototype);
    }
}
