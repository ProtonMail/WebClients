import ProtonLogo from '@proton/components/components/logo/ProtonLogo';
import { locales } from '@proton/shared/lib/i18n/locales';

import LanguageSelect from '../../../../../layout/LanguageSelect';

const Header = () => (
    <header
        className="flex justify-center items-center gap-4 py-4 px-4 md:px-8 w-full max-w-custom md:h-custom justify-space-between mx-auto"
        style={{ '--max-w-custom': '90rem', '--md-h-custom': '4.4rem' }}
    >
        <ProtonLogo color="invert" />
        <LanguageSelect
            locales={locales}
            globe={true}
            style={{
                '--button-default-text-color': 'white',
                '--button-hover-text-color': 'white',
                '--button-active-text-color': 'white',
            }}
        />
    </header>
);

export default Header;
