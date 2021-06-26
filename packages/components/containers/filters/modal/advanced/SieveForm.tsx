import React, { useMemo } from 'react';
import { c } from 'ttag';
import { isDarkTheme } from '@proton/shared/lib/themes/helpers';
import { UserSettings } from '@proton/shared/lib/interfaces';
import { Alert } from '../../../../components';

import SieveEditor from './SieveEditor';

import { AdvancedSimpleFilterModalModel } from '../../interfaces';

interface Props {
    model: AdvancedSimpleFilterModalModel;
    onChange: (newModel: AdvancedSimpleFilterModalModel) => void;
    userSettings: UserSettings;
}

const SieveForm = ({ model, userSettings, onChange }: Props) => {
    const theme = useMemo(() => (isDarkTheme() ? 'base16-dark' : ''), [userSettings.Theme]);
    return (
        <>
            <Alert learnMore="https://protonmail.com/support/knowledge-base/sieve-advanced-custom-filters/">
                {c('Info')
                    .t`Custom filters work on all new emails, including incoming emails as well as sent emails. Filters can be edited and created directly via Sieve programming language.`}
            </Alert>
            <SieveEditor
                value={model.sieve}
                issues={model.issues}
                theme={theme}
                onChange={(editor, data, sieve) => onChange({ ...model, sieve })}
            />
        </>
    );
};

export default SieveForm;
