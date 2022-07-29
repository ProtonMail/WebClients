import { Suspense, lazy, useMemo } from 'react';

import { Loader } from '@proton/components/components';
import { UserSettings } from '@proton/shared/lib/interfaces';
import { isDarkTheme } from '@proton/shared/lib/themes/helpers';

import { AdvancedSimpleFilterModalModel } from '../../interfaces';

const LazySieveEditor = lazy(() => import('./SieveEditor'));

interface Props {
    model: AdvancedSimpleFilterModalModel;
    onChange: (newModel: AdvancedSimpleFilterModalModel) => void;
    userSettings: UserSettings;
}

const SieveForm = ({ model, userSettings, onChange }: Props) => {
    const theme = useMemo(() => (isDarkTheme() ? 'base16-dark' : ''), [userSettings.Theme]);
    return (
        <Suspense fallback={<Loader size="large" />}>
            <LazySieveEditor
                value={model.sieve}
                issues={model.issues}
                theme={theme}
                onChange={(editor, data, sieve) => onChange({ ...model, sieve })}
            />
        </Suspense>
    );
};

export default SieveForm;
