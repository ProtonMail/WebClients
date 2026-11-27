import { Suspense, lazy, useMemo } from 'react';

import { Loader } from '@proton/atoms/Loader/Loader';
import { useTheme } from '@proton/theme/ThemeProvider';

import type { AdvancedSimpleFilterModalModel } from '../../interfaces';

const LazySieveEditor = lazy(() => import(/* webpackChunkName: "SieveEditor" */ './SieveEditor'));

interface Props {
    model: AdvancedSimpleFilterModalModel;
    onChange: (newModel: AdvancedSimpleFilterModalModel) => void;
}

const SieveForm = ({ model, onChange }: Props) => {
    const currentTheme = useTheme();
    const { dark } = currentTheme.information;

    const theme = useMemo(() => (dark ? 'base16-dark' : ''), [dark]);

    return (
        <Suspense fallback={<Loader size="large" />}>
            <LazySieveEditor
                value={model.sieve}
                issues={model.issues}
                theme={theme}
                // Issues belong to the script that was checked, so drop them once it changes
                onChange={(editor, data, sieve) =>
                    onChange({ ...model, sieve, issues: model.issues.length ? [] : model.issues })
                }
            />
        </Suspense>
    );
};

export default SieveForm;
