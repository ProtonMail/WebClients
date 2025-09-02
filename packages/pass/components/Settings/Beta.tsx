import type { FC } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { c } from 'ttag';

import Toggle from '@proton/components/components/toggle/Toggle';
import { settingsEditIntent } from '@proton/pass/store/actions';
import { selectBetaEnabled } from '@proton/pass/store/selectors';
import { BRAND_NAME, PASS_SHORT_APP_NAME } from '@proton/shared/lib/constants';

import { SettingsPanel } from './SettingsPanel';

export const Beta: FC = () => {
    const dispatch = useDispatch();
    const betaEnabled = useSelector(selectBetaEnabled);

    return (
        <SettingsPanel title={c('Label').t`Beta Access`}>
            <div className="pt-2">
                <Toggle
                    checked={betaEnabled}
                    onChange={() => dispatch(settingsEditIntent('behaviors', { beta: !betaEnabled }))}
                >
                    <span className="pl-2">
                        {c('Info').t`Enable ${PASS_SHORT_APP_NAME} beta`}
                        <span className="block color-weak text-sm">
                            {c('Info')
                                .t`Try new ${BRAND_NAME} features, updates and products before they are released to the public. This will reload the application`}
                        </span>
                    </span>
                </Toggle>
            </div>
        </SettingsPanel>
    );
};
