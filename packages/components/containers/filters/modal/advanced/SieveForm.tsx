import React, { useMemo } from 'react';
import { c } from 'ttag';
import { isDarkTheme } from 'proton-shared/lib/themes/helpers';
import { AdvancedSimpleFilterModalModel, ErrorsSieve } from 'proton-shared/lib/filters/interfaces';
import { MailSettings } from 'proton-shared/lib/interfaces';
import { Alert } from '../../../..';

import SieveEditor from './SieveEditor';

interface Props {
    model: AdvancedSimpleFilterModalModel;
    onChange: (newModel: AdvancedSimpleFilterModalModel) => void;
    errors: ErrorsSieve;
    mailSettings: MailSettings;
}

const SieveForm = ({ model, mailSettings, onChange }: Props) => {
    const theme = useMemo(() => (isDarkTheme(mailSettings.Theme) ? 'base16-dark' : ''), [mailSettings.Theme]);
    return (
        <>
            <Alert learnMore="https://protonmail.com/support/knowledge-base/sieve-advanced-custom-filters/">{c('Info')
                .t`Custom filters work on all new emails, including incoming emails as well as sent emails. To find out how to write Sieve filters.`}</Alert>
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
