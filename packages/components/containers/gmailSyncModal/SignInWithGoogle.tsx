import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import googleLogo from '@proton/styles/assets/img/import/providers/google.svg';

import './SignInWithGoogle.scss';

interface Props {
    fullWidth?: boolean;
    loading: boolean;
    disabled?: boolean;
    onClick: () => void;
    reduceHeight?: boolean;
}

const SignInWithGoogle = ({ loading, disabled, onClick, fullWidth, reduceHeight }: Props) => {
    const googleImageSize = reduceHeight ? 18 : 20;

    return (
        <Button
            color="norm"
            onClick={onClick}
            loading={loading}
            fullWidth={fullWidth}
            disabled={loading || disabled}
            className="flex flex-align-items-center p-1 rounded google-button"
        >
            <span
                className="bg-norm rounded-sm flex flex-justify-center flex-align-items-center w-custom min-h-custom"
                style={{ '--w-custom': '2.5rem', '--min-h-custom': '2.5rem' }}
            >
                <img src={googleLogo} alt="" width={googleImageSize} height={googleImageSize} aria-hidden="true" />
            </span>
            <span className="text-semibold flex-item-fluid text-left pl-4 pr-8">{c('Gmail forwarding')
                .t`Sign in with Google`}</span>
        </Button>
    );
};

export default SignInWithGoogle;
