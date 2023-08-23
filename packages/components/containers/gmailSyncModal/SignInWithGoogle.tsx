import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import googleLogo from '@proton/styles/assets/img/import/providers/google.svg';

import { useActiveBreakpoint } from '../..';

import './SignInWithGoogle.scss';

interface Props {
    fullWidth?: boolean;
    loading: boolean;
    disabled?: boolean;
    onClick: () => void;
    reduceHeight?: boolean;
}

const SignInWithGoogle = ({ loading, disabled, onClick, fullWidth, reduceHeight }: Props) => {
    const { isNarrow } = useActiveBreakpoint();
    const buttonHeight = !isNarrow && reduceHeight ? '2.5rem' : '3rem';
    const googleLogoSize = !isNarrow && reduceHeight ? '2rem' : '2.5rem';
    const googleImageSize = !isNarrow && reduceHeight ? 18 : 20;

    return (
        <Button
            color="norm"
            onClick={onClick}
            loading={loading}
            fullWidth={fullWidth}
            disabled={loading || disabled}
            className="flex flex-align-items-center p-1 rounded h-custom google-button"
            style={{ '--h-custom': buttonHeight }}
        >
            <span
                className="bg-norm rounded-sm flex flex-justify-center flex-align-items-center w-custom min-h-custom"
                style={{ '--w-custom': googleLogoSize, '--min-h-custom': googleLogoSize }}
            >
                <img src={googleLogo} alt="" width={googleImageSize} height={googleImageSize} aria-hidden="true" />
            </span>
            <span className="text-semibold flex-item-fluid text-left pl-4 pr-8">{c('Gmail forwarding')
                .t`Sign in with Google`}</span>
        </Button>
    );
};

export default SignInWithGoogle;
