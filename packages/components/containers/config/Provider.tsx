import { ReactNode } from 'react';

import { ProtonConfig } from '@proton/shared/lib/interfaces';

import ConfigContext from './configContext';

interface Props {
    children?: ReactNode;
    config: ProtonConfig;
}

const Provider = ({ config, children }: Props) => {
    return <ConfigContext.Provider value={config}>{children}</ConfigContext.Provider>;
};

export default Provider;
