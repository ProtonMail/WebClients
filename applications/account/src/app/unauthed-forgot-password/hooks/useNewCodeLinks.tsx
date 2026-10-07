import { useCallback } from 'react';

import { c } from 'ttag';

import { useNotifications } from '@proton/app-context/useNotifications';
import { InlineLinkButton } from '@proton/atoms/InlineLinkButton/InlineLinkButton';

/** The links that open the new code dialog: under the code field, and in the invalid code error. */
export const useNewCodeLinks = ({ onRequestNewCode }: { onRequestNewCode: () => void }) => {
    const RequestNewCodeLink = (
        <InlineLinkButton className="color-danger" onClick={onRequestNewCode} key="request-new-code-link">{c('Action')
            .t`Request new code`}</InlineLinkButton>
    );

    // translator: full sentence: "Invalid code. Request new code and try again."
    const InvalidCodeErrorMessage = c('Info').jt`Invalid code. ${RequestNewCodeLink} and try again.`;

    const AssistiveText = (
        <InlineLinkButton onClick={onRequestNewCode}>{c('Action').t`Didn't receive a code?`}</InlineLinkButton>
    );

    return { InvalidCodeErrorMessage, AssistiveText };
};

/** Tells the user the new code was sent. Stable, like `createNotification`, so effects can depend on it. */
export const useNotifyCodeSent = () => {
    const { createNotification } = useNotifications();
    return useCallback(() => createNotification({ text: c('Info').t`Verification code sent.` }), [createNotification]);
};
