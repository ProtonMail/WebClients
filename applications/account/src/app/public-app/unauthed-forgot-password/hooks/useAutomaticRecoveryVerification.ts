import useSearchParamsEffect from '@proton/components/hooks/useSearchParamsEffect';

import { ForgotPasswordContext } from '../wizard/ForgotPasswordContext';

interface Props {
    /** A username alone just fills in the form. */
    onUsername: (username: string) => void;
}

/**
 * A reset link (username and token in the URL) has the machine check the token right away. The parameters are
 * removed from the URL once read.
 */
export const useAutomaticRecoveryVerification = ({ onUsername }: Props) => {
    const { send } = ForgotPasswordContext.useActorRef();

    useSearchParamsEffect((params) => {
        const username = params.get('username');
        const token = params.get('token');
        const variant = params.get('variant');

        if (username && token) {
            send({ type: 'resetLink.opened', payload: { username, token } });
            return new URLSearchParams(variant ? { variant } : undefined);
        }

        if (username) {
            send({ type: 'username.prefilled', payload: { username } });
            onUsername(username);
            return new URLSearchParams(variant ? { variant } : undefined);
        }
    }, []);
};
