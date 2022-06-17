import { useMemo } from 'react';
import { isDarkTheme } from '@proton/shared/lib/themes/helpers';
import { UserSettings } from '@proton/shared/lib/interfaces';

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
        <SieveEditor
            value={model.sieve}
            issues={model.issues}
            theme={theme}
            onChange={(editor, data, sieve) => onChange({ ...model, sieve })}
        />
    );
};

export default SieveForm;
