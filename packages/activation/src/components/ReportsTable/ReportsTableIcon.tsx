import type { ReactNode } from 'react';

import type { ApiImportProvider } from '@proton/activation/src/api/api.interface';
import { getImportProviderFromApiProvider } from '@proton/activation/src/helpers/getImportProviderFromApiProvider';
import { ImportProvider, ImportType } from '@proton/activation/src/interface';
import Logo from '@proton/components/components/logo/Logo';
import { APPS } from '@proton/shared/lib/constants';
import contactsLogo from '@proton/styles/assets/img/import/importTypes/contacts.svg';
import googleLogo from '@proton/styles/assets/img/import/providers/google.svg';
import outlookLogo from '@proton/styles/assets/img/import/providers/outlook.svg';
import yahooLogo from '@proton/styles/assets/img/import/providers/yahoo_short.svg';

interface Props {
    provider: ApiImportProvider;
    product: ImportType;
}

const providerLogos: Partial<Record<ImportProvider, string>> = {
    [ImportProvider.GOOGLE]: googleLogo,
    [ImportProvider.OUTLOOK]: outlookLogo,
    [ImportProvider.YAHOO]: yahooLogo,
};

const productLogos: Partial<Record<ImportType, ReactNode>> = {
    [ImportType.MAIL]: <Logo appName={APPS.PROTONMAIL} variant="glyph-only" size={5} className="self-center mr-4" />,
    [ImportType.CALENDAR]: (
        <Logo appName={APPS.PROTONCALENDAR} variant="glyph-only" size={5} className="self-center mr-4" />
    ),
    [ImportType.CONTACTS]: <img src={contactsLogo} alt="" className="self-center mr-4" width={20} />,
};

export const ReportsTableIcon = ({ provider: apiProvider, product }: Props) => {
    const provider = getImportProviderFromApiProvider(apiProvider);

    const logo = providerLogos[provider];

    if (logo) {
        return <img src={logo} alt="" className="self-center mr-4" width={20} />;
    }

    return <>{productLogos[product]}</>;
};
