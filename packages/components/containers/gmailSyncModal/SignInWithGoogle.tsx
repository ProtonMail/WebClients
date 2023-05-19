import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import googleLogo from '@proton/styles/assets/img/import/providers/google.svg';

import './SignInWithGoogle.scss';

interface Props {
    loading: boolean;
    onClick: () => void;
}

const SignInWithGoogle = ({ loading, onClick }: Props) => {
    return (
        <Button
            fullWidth
            color="norm"
            onClick={onClick}
            loading={loading}
            disabled={loading}
            className="flex flex-align-items-center p-1 rounded h-custom google-button"
            style={{ '--height-custom': '3rem' }}
        >
            <span
                className="bg-norm rounded-sm flex flex-justify-center flex-align-items-center h-custom w-custom"
                style={{ '--width-custom': '2.5rem', '--height-custom': '2.5rem' }}
            >
                <img src={googleLogo} alt="" width={20} height={20} aria-hidden="true" />
            </span>
            <span className="text-semibold flex-item-fluid text-left pl-4 pr-8">{c('Gmail forwarding')
                .t`Sign in with Google`}</span>
        </Button>
    );
};

export default SignInWithGoogle;
