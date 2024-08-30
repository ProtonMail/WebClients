import { type FC } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { c } from 'ttag';

import { Checkbox } from '@proton/components';
import { settingsEditIntent } from '@proton/pass/store/actions';
import { settingsEditRequest } from '@proton/pass/store/actions/requests';
import { selectCanLoadDomainImages, selectRequestInFlight } from '@proton/pass/store/selectors';
import { BRAND_NAME, PASS_APP_NAME } from '@proton/shared/lib/constants';

import { SettingsPanel } from './SettingsPanel';

export const Display: FC = () => {
    const dispatch = useDispatch();
    const canLoadDomainImages = useSelector(selectCanLoadDomainImages);
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
        </SettingsPanel>
    );
};
