import { type FC, useEffect, useState } from 'react';

import {
    AUTOFILL_CONTROLLABLE,
    checkBrowserAutofillCapabilities,
    setBrowserAutofillCapabilities,
} from 'proton-pass-extension/lib/utils/privacy';
import { c } from 'ttag';

import { Checkbox } from '@proton/components';
import { SettingsPanel } from '@proton/pass/components/Settings/SettingsPanel';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';

export const Browser: FC = () => {
    const [browserAutofill, setBrowserAutofill] = useState(AUTOFILL_CONTROLLABLE);

    useEffect(() => {
        void checkBrowserAutofillCapabilities().then(setBrowserAutofill);
    }, [browserAutofill]);

    return (
        <SettingsPanel key={`settings-section-browser`} title={c('Label').t`Browser settings`}>
            <Checkbox
                checked={browserAutofill}
                onChange={() => setBrowserAutofillCapabilities(!browserAutofill).then(setBrowserAutofill)}
            >
                <span>
                    {c('Label').t`Use ${PASS_APP_NAME} as your browser's default password manager`}
                    <span className="block color-weak text-sm">{c('Label')
                        .t`Your browser will stop using its built-in password manager.`}</span>
                </span>
            </Checkbox>
        </SettingsPanel>
    );
};
