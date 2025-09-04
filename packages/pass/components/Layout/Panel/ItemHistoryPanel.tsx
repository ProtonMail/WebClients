import type { FC, PropsWithChildren, ReactElement, ReactNode } from 'react';

import { itemTypeToSubThemeClassName } from '@proton/pass/components/Layout/Theme/types';
import type { ItemType } from '@proton/pass/types';
import clsx from '@proton/utils/clsx';

import { Panel } from './Panel';
import { PanelHeader } from './PanelHeader';

type Props = {
    actions?: ReactElement[];
    footer?: ReactNode;
    title: ReactNode;
    type: ItemType;
};

export const ItemHistoryPanel: FC<PropsWithChildren<Props>> = ({ children, actions, footer, title, type }) => (
    <Panel
        className={clsx(itemTypeToSubThemeClassName[type], 'relative')}
        header={<PanelHeader title={title} actions={actions} />}
        footer={footer}
    >
        {children}
    </Panel>
);
