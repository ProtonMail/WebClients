import Logo from '@proton/components/components/logo/Logo';
import { APPS } from '@proton/shared/lib/constants';
import { locales } from '@proton/shared/lib/i18n/locales';

import LanguageSelect from '../../../../public/LanguageSelect';

const BornPrivateHeader = () => {
    return (
        <header className="flex items-center justify-space-between shrink-0 w-full mx-auto py-6">
            <Logo appName={APPS.PROTONMAIL} hasTitle />
            <LanguageSelect globe locales={locales} />
        </header>
    );
};

export default BornPrivateHeader;
