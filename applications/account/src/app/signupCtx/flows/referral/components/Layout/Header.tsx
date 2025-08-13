import { Link } from 'react-router-dom';

import { c } from 'ttag';

import { ProtonLogo } from '@proton/components';

import { useSignup } from '../../../../context/SignupContext';

interface HeaderProps {
    showSignIn?: boolean;
}

const Header = ({ showSignIn = false }: HeaderProps) => {
    const { loginUrl } = useSignup();

    const signIn = (
        <Link key="signin" className="link link-focus text-nowrap" to={loginUrl}>
            {c('Link').t`Sign in`}
        </Link>
    );

    return (
        <header
            className="flex justify-center items-center gap-4 py-4 px-4 md:px-8 max-w-custom md:h-custom justify-space-between mx-auto"
            style={{ '--max-w-custom': '90rem', '--md-h-custom': '4.4rem' }}
        >
            <ProtonLogo />
            {showSignIn && <div>{c('Go to sign in').jt`Already have an account? ${signIn}`}</div>}
        </header>
    );
};

export default Header;
