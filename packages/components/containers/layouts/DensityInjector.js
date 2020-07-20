import { useEffect } from 'react';
import { useUserSettings } from 'react-components';
import { DENSITY } from 'proton-shared/lib/constants';

const { COMPACT, COMFORTABLE } = DENSITY;

const CLASSES = {
    [COMPACT]: 'is-compact',
    [COMFORTABLE]: 'is-comfortable',
};

const DensityInjector = () => {
    const [{ Density } = {}] = useUserSettings();

    useEffect(() => {
        document.body.classList.add(CLASSES[Density]);
        return () => {
            document.body.classList.remove(CLASSES[Density]);
        };
    }, [Density]);

    return null;
};

export default DensityInjector;
