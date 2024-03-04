import type { PropsWithChildren, ReactNode } from 'react';
import { type FC, type ReactElement } from 'react';

import { itemTypeToSubThemeClassName } from '@proton/pass/components/Layout/Theme/types';
import { type ItemType } from '@proton/pass/types';

import { Panel } from './Panel';
import { PanelHeader } from './PanelHeader';

type Props = {
    actions?: ReactElement[];
    footer?: ReactNode;
    title: ReactNode;
    type: ItemType;
};

export const ItemHistoryPanel: FC<PropsWithChildren<Props>> = ({ children, actions, footer, title, type }) => {
    return (
        <Panel
            className={itemTypeToSubThemeClassName[type]}
            header={<PanelHeader title={title} actions={actions} />}
            footer={footer}
        >
            {children}
        </Panel>
    );
};
