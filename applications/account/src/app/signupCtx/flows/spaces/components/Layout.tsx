import type { ComponentProps, ReactNode } from 'react';

import { c } from 'ttag';

import { Href } from '@proton/atoms/Href/Href';
import SpacesLogo from '@proton/components/components/logo/SpacesLogo';
import { useTheme } from '@proton/components/containers/themes/ThemeProvider';
import { APPS } from '@proton/shared/lib/constants';
import { getPrivacyPolicyURL } from '@proton/shared/lib/helpers/url';
import { locales } from '@proton/shared/lib/i18n/locales';

import { getLocaleTermsURL } from '../../../../content/helper';
import LanguageSelect from '../../../../public/LanguageSelect';
import SignupSupportDropdown from '../../../../signup/SignupSupportDropdown';
import backgroundDark from '../assets/images/bg-dark.png';
import backgroundLight from '../assets/images/bg-light.png';
import InvitePanel from './InvitePanel';

import '../../../shared/styles/arizona.scss';
import './layout.scss';

const Header = () => {
    return (
        <header className="w-full px-4 pt-14 md:px-8 pb-14 flex items-center justify-center shrink-0 relative">
            <SpacesLogo />
        </header>
    );
};

const Footer = () => {
    return (
        <footer className="flex justify-center items-center p-4 gap-8">
            <Href key="privacy" className="signup-link link-focus" href={getPrivacyPolicyURL(APPS.PROTONSPACES)}>
                {c('Link').t`Privacy policy`}
            </Href>
            <Href key="terms" className="signup-link link-focus" href={getLocaleTermsURL(APPS.PROTONSPACES)}>
                {c('Link').t`Terms`}
            </Href>
            <SignupSupportDropdown />
            <LanguageSelect locales={locales} globe={true} />
        </footer>
    );
};

const Layout = ({ children, invite }: { children: ReactNode; invite?: ComponentProps<typeof InvitePanel> }) => {
    const { information } = useTheme();
    const isDark = information.dark;

    return (
        <div
            className="flex flex-column flex-nowrap h-full overflow-auto relative"
            style={{ backgroundColor: isDark ? '#000000' : '#ffffff' }}
        >
            <div
                className="pointer-events-none fixed inset-0 opacity-40"
                style={{
                    backgroundImage: `url(${isDark ? backgroundDark : backgroundLight})`,
                    backgroundSize: '90rem auto',
                    backgroundPosition: '50vw 0',
                    backgroundRepeat: 'repeat-x',
                }}
                aria-hidden="true"
            />
            <div className="relative flex flex-column flex-nowrap flex-1">
                <Header />
                <div className="flex flex-1 items-start justify-center px-4 pb-4">
                    <main className="w-full flex justify-center">
                        {invite ? (
                            <div className="spaces-card spaces-card-invite w-full flex flex-column md:flex-row shadow-norm bg-norm overflow-hidden">
                                <div className="spaces-card-aside p-10">
                                    <InvitePanel {...invite} />
                                </div>
                                <div className="flex-1 p-10">{children}</div>
                            </div>
                        ) : (
                            <div className="spaces-card spaces-card-single w-full shadow-norm bg-norm overflow-hidden p-10">
                                {children}
                            </div>
                        )}
                    </main>
                </div>
                <Footer />
            </div>
        </div>
    );
};

export default Layout;
