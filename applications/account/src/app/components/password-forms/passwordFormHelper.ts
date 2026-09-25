import { c } from 'ttag';

interface PasswordFormLabels {
    formName: string;
    passwordLabel: string;
    confirmPasswordLabel: string;
    cta: string;
}

export const getChangePasswordFormLabels = (): PasswordFormLabels => {
    return {
        formName: 'setPasswordForm',
        passwordLabel: c('Label').t`New password`,
        confirmPasswordLabel: c('Label').t`Confirm password`,
        cta: c('Action').t`Continue`,
    };
};

export const getCreatePasswordFormLabels = (): PasswordFormLabels => {
    return {
        formName: 'setPasswordForm',
        passwordLabel: c('Label').t`Password`,
        confirmPasswordLabel: c('Label').t`Confirm password`,
        cta: c('Action').t`Continue`,
    };
};

export const getBackupPasswordFormLabels = (): PasswordFormLabels => {
    return {
        formName: 'setBackupPasswordForm',
        passwordLabel: c('Label').t`Backup password`,
        confirmPasswordLabel: c('Label').t`Repeat backup password`,
        cta: c('Action').t`Continue`,
    };
};
