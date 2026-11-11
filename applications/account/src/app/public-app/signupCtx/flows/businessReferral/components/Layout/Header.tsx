import { Link } from 'react-router-dom';

import { c } from 'ttag';

import ProtonLogo from '@proton/components/components/logo/ProtonLogo';

import { useSignup } from '../../../../context/SignupContext';

const Header = () => {
    const { loginUrl } = useSignup();

    const signIn = (
        <Link key="signin" className="link link-focus text-nowrap" to={loginUrl}>
            {c('Link').t`Sign in`}
        </Link>
    );

    return (
        <header
            className="flex justify-center items-center gap-4 py-4 px-4 md:px-8 w-full max-w-custom md:h-custom justify-space-between mx-auto"
            style={{ '--max-w-custom': '90rem', '--md-h-custom': '4.4rem' }}
        >
            <ProtonLogo color="invert" />
            <div>{c('Go to sign in').jt`Already have an account? ${signIn}`}</div>
        </header>
    );
};

export default Header;
