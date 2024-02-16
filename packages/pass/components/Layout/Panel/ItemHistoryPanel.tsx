import type { PropsWithChildren } from 'react';
import { type FC, type ReactElement } from 'react';

import { c } from 'ttag';

import { itemTypeToSubThemeClassName } from '@proton/pass/components/Layout/Theme/types';
import { type ItemType } from '@proton/pass/types';

import { Panel } from './Panel';
import { PanelHeader } from './PanelHeader';

type Props = {
    title: string;
    /** actions visible on the left of the panel header */
    leftActions?: ReactElement[];
    /** actions visible on the right of the panel header */
    rightActions?: ReactElement[];
    type: ItemType;
};

export const ItemHistoryPanel: FC<PropsWithChildren<Props>> = ({ children, leftActions, rightActions, type }) => {
    return (
        <Panel
            className={itemTypeToSubThemeClassName[type]}
            header={
                <PanelHeader
                    title={c('Title').t`History`}
                    className="mb-4"
                    leftActions={leftActions}
                    actions={rightActions}
                />
            }
        >
            {children}
        </Panel>
    );
};
