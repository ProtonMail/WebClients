import type { ReactNode } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';

export const SubmitButton = ({
    submitting,
    compactForm,
    children,
}: {
    submitting: boolean;
    compactForm: boolean;
    children: ReactNode;
}) => (
    <Button
        size="large"
        color="norm"
        type="submit"
        fullWidth
        loading={submitting}
        className={compactForm ? 'mt-4' : 'mt-6'}
    >
        {children}
    </Button>
);

export const getSignInButtonText = (submitting: boolean, signInText: string) =>
    // translator: when the "sign in" button is in loading state, it gets updated to "Signing in"
    submitting ? c('Action').t`Signing in` : signInText;
