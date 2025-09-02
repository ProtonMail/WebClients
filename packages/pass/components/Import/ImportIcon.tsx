import type { FC } from 'react';

import onepassword from '@proton/pass/assets/import/1password-icon-48.png';
import applePasswords from '@proton/pass/assets/import/apple-passwords-icon-48.png';
import bitwarden from '@proton/pass/assets/import/bitwarden-icon-48.png';
import brave from '@proton/pass/assets/import/brave-icon-48.png';
import chrome from '@proton/pass/assets/import/chrome-icon-48.png';
import csv from '@proton/pass/assets/import/csv-icon-48.png';
import dashlane from '@proton/pass/assets/import/dashlane-icon-48.png';
import edge from '@proton/pass/assets/import/edge-icon-48.png';
import enpass from '@proton/pass/assets/import/enpass-icon-48.png';
import firefox from '@proton/pass/assets/import/firefox-icon-48.png';
import kaspersky from '@proton/pass/assets/import/kaspersky-icon-48.png';
import keepass from '@proton/pass/assets/import/keepass-icon-48.png';
import keeper from '@proton/pass/assets/import/keeper-icon-48.png';
import lastpass from '@proton/pass/assets/import/lastpass-icon-48.png';
import nordpass from '@proton/pass/assets/import/nordpass-icon-48.png';
import protonpass from '@proton/pass/assets/import/protonpass-icon-48.png';
import roboform from '@proton/pass/assets/import/roboform-icon-48.png';
import safari from '@proton/pass/assets/import/safari-icon-48.png';
import { ImportProvider, PROVIDER_INFO_MAP } from '@proton/pass/lib/import/types';

type ImportIconMap = Record<ImportProvider, string>;

const IMPORT_ICON_MAP: ImportIconMap = {
    [ImportProvider.APPLEPASSWORDS]: applePasswords,
    [ImportProvider.BITWARDEN]: bitwarden,
    [ImportProvider.BRAVE]: brave,
    [ImportProvider.CHROME]: chrome,
    [ImportProvider.DASHLANE]: dashlane,
    [ImportProvider.EDGE]: edge,
    [ImportProvider.ENPASS]: enpass,
    [ImportProvider.FIREFOX]: firefox,
    [ImportProvider.KEEPASS]: keepass,
    [ImportProvider.KEEPER]: keeper,
    [ImportProvider.LASTPASS]: lastpass,
    [ImportProvider.ONEPASSWORD]: onepassword,
    [ImportProvider.NORDPASS]: nordpass,
    [ImportProvider.PROTONPASS]: protonpass,
    [ImportProvider.ROBOFORM]: roboform,
    [ImportProvider.SAFARI]: safari,
    [ImportProvider.CSV]: csv,
    [ImportProvider.KASPERSKY]: kaspersky,
};

type Props = { provider: ImportProvider; className?: string };

export const ImportIcon: FC<Props> = ({ provider, className }) => {
    return (
        <img
            className={className}
            alt={PROVIDER_INFO_MAP[provider].title}
            src={IMPORT_ICON_MAP[provider]}
            width="24"
            height="24"
        />
    );
};
