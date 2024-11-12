import type { FC, PropsWithChildren } from 'react';

import {
    LIST_MAX_HEIGHT,
    LIST_MAX_VISIBLE_ITEMS,
} from 'proton-pass-extension/app/content/injections/apps/components/ListItem';

import { Scroll } from '@proton/atoms';
import { DropdownMenu } from '@proton/components';
import clsx from '@proton/utils/clsx';

import './ScrollableItemsList.scss';

type Props = PropsWithChildren<{ increaseSurface?: boolean }>;

export const ScrollableItemsList: FC<Props> = ({ children, increaseSurface }) => (
    <DropdownMenu
        className={clsx(
            'pass-scrollable-items-list',
            increaseSurface && 'pass-scrollable-items-list--increase-surface'
        )}
    >
        <div className="max-h-custom overflow-hidden" style={{ '--max-h-custom': `${LIST_MAX_HEIGHT}rem` }}>
            <Scroll
                {...(Array.isArray(children) && children.length >= LIST_MAX_VISIBLE_ITEMS
                    ? { style: { height: `${LIST_MAX_HEIGHT}rem` } }
                    : {})}
            >
                {children}
            </Scroll>
        </div>
    </DropdownMenu>
);
