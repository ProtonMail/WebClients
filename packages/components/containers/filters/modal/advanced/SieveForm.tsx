import { Suspense, lazy, useMemo } from 'react';

import { Loader } from '@proton/components/components';
import { useTheme } from '@proton/components/containers';
import { UserSettings } from '@proton/shared/lib/interfaces';

import { AdvancedSimpleFilterModalModel } from '../../interfaces';

const LazySieveEditor = lazy(() => import(/* webpackChunkName: "SieveEditor" */ './SieveEditor'));

interface Props {
    model: AdvancedSimpleFilterModalModel;
    onChange: (newModel: AdvancedSimpleFilterModalModel) => void;
    userSettings: UserSettings;
}

const SieveForm = ({ model, userSettings, onChange }: Props) => {
    const currentTheme = useTheme();
    const { dark } = currentTheme.information;

    const theme = useMemo(() => (dark ? 'base16-dark' : ''), [userSettings.Theme]);

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
