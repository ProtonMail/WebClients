export type PasswordScore = 'Vulnerable' | 'Weak' | 'Strong';
export type PasswordPenalties =
    | 'NoLowercase'
    | 'NoUppercase'
    | 'NoNumbers'
    | 'NoSymbols'
    | 'Short'
    | 'Consecutive'
    | 'Progressive'
    | 'ContainsCommonPassword'
    | 'ShortWordList';

export type ConsolidatedPasswordPenalties =
    | 'Short'
    | 'NoLowercaseOrUppercase'
    | 'NoNumbers'
    | 'NoSymbols'
    | 'ProgressiveOrConsecutive'
    | 'ContainsCommonPasswordOrShortWordList';

export type PasswordStrengthIndicatorVariant = 'compact' | 'large';
