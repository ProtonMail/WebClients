import { type FC } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { c } from 'ttag';

import { Checkbox } from '@proton/components';
import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import { settingsEditIntent } from '@proton/pass/store/actions';
import { settingsEditRequest } from '@proton/pass/store/actions/requests';
import {
    selectCanLoadDomainImages,
    selectRequestInFlight,
    selectShowUsernameField,
} from '@proton/pass/store/selectors';
import { TelemetryEventName } from '@proton/pass/types/data/telemetry';
import { BRAND_NAME, PASS_APP_NAME } from '@proton/shared/lib/constants';

import { SettingsPanel } from './SettingsPanel';

export const Display: FC = () => {
    const { onTelemetry } = usePassCore();
    const dispatch = useDispatch();
    const canLoadDomainImages = useSelector(selectCanLoadDomainImages);
    const showUsernameField = useSelector(selectShowUsernameField);
    const loading = useSelector(selectRequestInFlight(settingsEditRequest('behaviors')));

    return (
        <SettingsPanel title={c('Label').t`Display`}>
            <Checkbox
                checked={canLoadDomainImages}
                disabled={loading}
                loading={loading}
                onChange={() => dispatch(settingsEditIntent('behaviors', { loadDomainImages: !canLoadDomainImages }))}
            >
                <span>
                    {c('Label').t`Show website favicons`}
                    <span className="block color-weak text-sm">
                        {c('Info')
                            .t`${PASS_APP_NAME} will display the item favicon via ${BRAND_NAME} anonymized image proxy.`}
                    </span>
                </span>
            </Checkbox>
            <Checkbox
                className="mt-2"
                checked={showUsernameField}
                disabled={loading}
                loading={loading}
                onChange={() => {
                    dispatch(settingsEditIntent('behaviors', { showUsernameField: !showUsernameField }));
                    onTelemetry(TelemetryEventName.PassSettingsDisplayUsername, { checked: !showUsernameField }, {});
                }}
            >
                <span>
                    {c('Label').t`Always show username field`}
                    <span className="block color-weak text-sm">
                        {c('Info')
                            .t`When creating/editing a Login on ${PASS_APP_NAME} the 'username' input will always be visible.`}
                    </span>
                </span>
            </Checkbox>
        </SettingsPanel>
    );
};
