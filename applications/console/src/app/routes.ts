import { IcHouse } from '@proton/icons/icons/IcHouse';

import type { ConsoleRoute } from './interface';

export const getRoutes = (): ConsoleRoute[] => [
    {
        to: '/overview',
        text: 'Overview',
        icon: IcHouse,
    },
];
