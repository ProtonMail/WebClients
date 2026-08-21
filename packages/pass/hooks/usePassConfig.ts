import { useContext } from 'react';

import { ConfigContext } from '@proton/app-context/configContext';
import type { ProtonConfig } from '@proton/shared/lib/interfaces';

export type PassConfig = ProtonConfig & { SSO_URL: string };

export const usePassConfig = () => useContext(ConfigContext) as PassConfig;
