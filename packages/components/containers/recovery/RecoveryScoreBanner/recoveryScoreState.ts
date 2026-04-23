import { c } from 'ttag';

export type RecoveryScoreTone = 'danger' | 'warning' | 'success' | 'info';

export const SCORE_TONE_CLASS: Record<RecoveryScoreTone, string> = {
    danger: 'color-danger',
    warning: 'color-warning',
    success: 'color-success',
    info: 'color-info',
};

export const SCORE_TONE_BG_CLASS: Record<RecoveryScoreTone, string> = {
    danger: 'bg-danger',
    warning: 'bg-warning',
    success: 'bg-success',
    info: 'bg-info',
};

export const getRecoveryScoreTone = (score: number): RecoveryScoreTone => {
    if (score < 1) {
        return 'danger';
    }

    if (score <= 5) {
        return 'warning';
    }

    if (score <= 7) {
        return 'info';
    }

    return 'success';
};

export const getRecoveryScoreState = (score: number): { label: string; tone: RecoveryScoreTone } => {
    if (score < 1) {
        return { label: c('Recovery score').t`Unprotected`, tone: 'danger' };
    }

    if (score <= 5) {
        return { label: c('Recovery score').t`Weak`, tone: 'warning' };
    }

    if (score <= 7) {
        return { label: c('Recovery score').t`Partial`, tone: 'info' };
    }

    if (score <= 9) {
        return { label: c('Recovery score').t`Strong`, tone: 'success' };
    }

    return { label: c('Recovery score').t`Maximum`, tone: 'success' };
};

export const getRecoveryScoreHint = (score: number) => {
    if (score <= 4) {
        return c('Recovery score').t`Add more options to avoid getting locked out of your account.`;
    }

    if (score <= 6) {
        return c('Recovery score').t`Good start. Add more options for a stronger protection.`;
    }

    if (score <= 8) {
        return c('Recovery score').t`Great. Add more options for a stronger protection.`;
    }

    return c('Recovery score').t`Awesome. Keep your options up-to-date for stronger protection.`;
};
