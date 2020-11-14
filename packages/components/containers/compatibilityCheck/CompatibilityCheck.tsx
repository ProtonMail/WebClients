import React, { useMemo } from 'react';
import { useConfig } from '../../hooks';
import CompatibilityCheckView from './CompatibilityCheckView';
import { getCompatibilityList } from './compatibilityCheckHelper';

interface Props {
    children: React.ReactNode;
}

const CompatibilityCheck = ({ children }: Props) => {
    const { APP_NAME } = useConfig();

    const incompatibilities = useMemo(() => {
        return getCompatibilityList().filter(({ valid }) => !valid);
    }, []);

    if (!incompatibilities.length) {
        return <>{children}</>;
    }

    return <CompatibilityCheckView appName={APP_NAME} incompatibilities={incompatibilities} />;
};

export default CompatibilityCheck;
