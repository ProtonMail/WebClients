import { type FC, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import {
    AUTOFILL_CONTROLLABLE,
    checkBrowserAutofillCapabilities,
    setBrowserAutofillCapabilities,
} from 'proton-pass-extension/lib/utils/privacy';
import { c } from 'ttag';

import Checkbox from '@proton/components/components/input/Checkbox';
import { SettingsPanel } from '@proton/pass/components/Settings/SettingsPanel';
import { settingsEditIntent } from '@proton/pass/store/actions';
import { selectPendingBrowserAutofill } from '@proton/pass/store/selectors';
import { getEpoch } from '@proton/pass/utils/time/epoch';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';

export const Browser: FC = () => {
    const dispatch = useDispatch();
    const pendingBrowserAutofill = useSelector(selectPendingBrowserAutofill);
    const [browserAutofill, setBrowserAutofill] = useState<boolean>(AUTOFILL_CONTROLLABLE);

    const storePending = () => dispatch(settingsEditIntent('browser', { pendingBrowserAutofill: getEpoch() }));

    useEffect(() => {
        const pending = pendingBrowserAutofill ? getEpoch() - pendingBrowserAutofill <= 1 : false;
        void checkBrowserAutofillCapabilities(pending).then(setBrowserAutofill);
    }, []);

    const handleChange = () => setBrowserAutofillCapabilities(!browserAutofill, storePending).then(setBrowserAutofill);

    return (
        <SettingsPanel key={`settings-section-browser`} title={c('Label').t`Browser settings`}>
            <Checkbox checked={browserAutofill} onChange={handleChange}>
                <span>
                    {c('Label').t`Use ${PASS_APP_NAME} as your browser's default password manager`}
                    <span className="block color-weak text-sm">{c('Label')
                        .t`Your browser will stop using its built-in password manager.`}</span>
                </span>
            </Checkbox>
        </SettingsPanel>
    );
};
