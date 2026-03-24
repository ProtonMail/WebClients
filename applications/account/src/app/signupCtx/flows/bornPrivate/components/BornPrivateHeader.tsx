import { Logo } from '@proton/components/index';
import { APPS } from '@proton/shared/lib/constants';
import { locales } from '@proton/shared/lib/i18n/locales';
import { useFlag } from '@proton/unleash/useFlag';

import LanguageSelect from '../../../../public/LanguageSelect';

const BornPrivateHeader = () => {
    const isBornPrivateEuropeEnabled = useFlag('BornPrivateEurope');

    return (
        <header className="flex items-center justify-space-between shrink-0 w-full mx-auto py-6">
            <Logo appName={APPS.PROTONMAIL} hasTitle />
            {isBornPrivateEuropeEnabled && <LanguageSelect globe locales={locales} />}
        </header>
    );
};

export default BornPrivateHeader;
