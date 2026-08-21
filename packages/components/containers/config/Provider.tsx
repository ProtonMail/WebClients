import type { ReactNode } from 'react';

import { ConfigContext } from '@proton/app-context/configContext';
import type { ProtonConfig } from '@proton/shared/lib/interfaces';

interface Props {
    children?: ReactNode;
    config: ProtonConfig;
}

const Provider = ({ config, children }: Props) => {
    return <ConfigContext.Provider value={config}>{children}</ConfigContext.Provider>;
};

export default Provider;
