import { c } from 'ttag';

import { BRAND_NAME } from '@proton/shared/lib/constants';

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
    if (score <= 4) {
        return 'danger';
    }

    if (score <= 6) {
        return 'warning';
    }

    if (score <= 7) {
        return 'info';
    }

    return 'success';
};

export const getRecoveryScoreState = (score: number): { label: string; tone: RecoveryScoreTone } => {
    if (score <= 2) {
        return { label: c('Recovery score').t`Critical`, tone: 'danger' };
    }

    if (score <= 4) {
        return { label: c('Recovery score').t`Weak`, tone: 'danger' };
    }

    if (score <= 6) {
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
    switch (score) {
        case 0:
            return c('Recovery score')
                .t`Your account has no recovery options set up. If you lose your password, you'll permanently lose access to your emails, files, and passwords.`;
        case 1:
            return c('Recovery score')
                .t`Your recovery setup is barely there. If you lose your password, you could permanently lose access to your emails, files, and passwords.`;
        case 2:
            return c('Recovery score')
                .t`You're still at high risk. If you forget your password, you could permanently lose your emails, files, and passwords.`;
        case 3:
            return c('Recovery score')
                .t`Your recovery setup is incomplete. A forgotten password could still mean losing access to your emails, files, and passwords.`;
        case 4:
            return c('Recovery score')
                .t`Your account isn't fully protected. A forgotten password could still mean losing access to your emails, files, and passwords.`;
        case 5:
            return c('Recovery score')
                .t`You're partly there, but not safe yet. A forgotten password could still mean losing your emails, files, and passwords.`;
        case 6:
            return c('Recovery score')
                .t`You're well covered, but there are still gaps. More recovery options give you a stronger safety net if you ever lose your password.`;
        case 7:
            return c('Recovery score')
                .t`Your recovery setup is solid, with a few gaps left to close. Each option you add makes your safety net stronger.`;
        case 8:
        case 9:
            return c('Recovery score')
                .t`Your recovery setup is excellent. Keep your options up to date so they still work when you need them.`;
        default:
            return c('Recovery score')
                .t`You're fully protected. A periodic review keeps everything working as your devices and contacts change over time.`;
    }
};

export const getRecoveryScoreTitle = (score: number) => {
    if (score <= 2) {
        return c('Recovery score').t`Don’t get locked out of your ${BRAND_NAME} Account`;
    }

    if (score <= 7) {
        return c('Recovery score').t`Take precautions to avoid losing access`;
    }

    if (score === 8) {
        return c('Recovery score').t`Check your access to your recovery options`;
    }

    return c('Recovery score').t`Your account and data can be recovered`;
};

export const getRecoveryScoreCta = (score: number) => {
    switch (score) {
        case 0:
        case 1:
        case 2:
            return c('Action').t`Set up account recovery`;
        case 3:
        case 4:
        case 5:
            return c('Action').t`Add recovery options`;
        default:
            return c('Action').t`Review recovery options`;
    }
};
