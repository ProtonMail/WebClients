import { Link } from 'react-router-dom';

import { c } from 'ttag';

import MeetLogo from '@proton/components/components/logo/MeetLogo';
import logo from '@proton/styles/assets/img/meet/brand-dual-colors.svg';
import clsx from '@proton/utils/clsx';

import { useSignup } from '../../../../context/SignupContext';

interface HeaderProps {
    showSignIn?: boolean;
}

const Header = ({ showSignIn = false }: HeaderProps) => {
    const { loginUrl } = useSignup();

    const signIn = (
        <Link key="signin" className="link link-focus text-nowrap" to={`${loginUrl}?theme=dark`}>
            {c('Link').t`Sign in`}
        </Link>
    );

    return (
        <header
            className="meet-page-header w-full py-4 flex items-center justify-space-between shrink-0 h-custom"
            style={{ '--h-custom': '5.625rem' }}
        >
            <div className={clsx('flex items-center gap-2')}>
                <div className="logo-button rounded-full hidden md:block p-2">
                    <img
                        className="logo cursor-pointer h-custom"
                        src={logo}
                        alt=""
                        style={{ '--h-custom': '2.5rem' }}
                    />
                </div>
                <div className="logo-button rounded-full block md:hidden p-1 flex items-center justify-center">
                    <MeetLogo variant="glyph-only" className="logo cursor-pointer" />
                </div>
            </div>
            {showSignIn && (
                <div className="color-weak">{c('Go to sign in').jt`Already have an account? ${signIn}`}</div>
            )}
        </header>
    );
};

export default Header;
