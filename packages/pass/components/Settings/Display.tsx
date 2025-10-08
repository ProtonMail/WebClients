import type { FC } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { c } from 'ttag';

import Checkbox from '@proton/components/components/input/Checkbox';
import { settingsEditIntent } from '@proton/pass/store/actions';
import { selectCanLoadDomainImages, selectShowUsernameField } from '@proton/pass/store/selectors';
import { BRAND_NAME, PASS_APP_NAME } from '@proton/shared/lib/constants';

import { SettingsPanel } from './SettingsPanel';

export const Display: FC = () => {
    const dispatch = useDispatch();
    const canLoadDomainImages = useSelector(selectCanLoadDomainImages);
    const showUsernameField = useSelector(selectShowUsernameField);

    return (
        <SettingsPanel title={c('Label').t`Display`}>
            <Checkbox
                checked={canLoadDomainImages}
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
                onChange={() =>
                    dispatch(
                        settingsEditIntent('behaviors', {
                            showUsernameField: !showUsernameField,
                        })
                    )
                }
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
