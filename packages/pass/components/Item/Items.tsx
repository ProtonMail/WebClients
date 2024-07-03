import type { FC } from 'react';
import { type RouteChildrenProps } from 'react-router-dom';

import { Content } from '@proton/pass/components/Layout/Section/Content';
import { SubSidebar } from '@proton/pass/components/Layout/Section/SubSidebar';
import { Autoselect } from '@proton/pass/components/Navigation/Autoselect';
import { ItemSwitch } from '@proton/pass/components/Navigation/ItemSwitch';

import { ItemsList } from './List/ItemsList';

export const Items: FC<RouteChildrenProps> = (subRoute) => (
    <>
        <SubSidebar>
            <ItemsList />
        </SubSidebar>
        <Content>
            <ItemSwitch fallback={Autoselect} {...subRoute} />
        </Content>
    </>
);
