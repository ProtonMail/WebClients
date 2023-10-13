import type { FC } from 'react';

import { Scroll } from '@proton/atoms';
import { DropdownMenu } from '@proton/components/components';

import { DROPDOWN_ITEM_HEIGHT } from './DropdownItem';

const DROPDOWN_MAX_VISIBLE_ITEMS = 3;
const DROPDOWN_LIST_MAX_HEIGHT = DROPDOWN_MAX_VISIBLE_ITEMS * DROPDOWN_ITEM_HEIGHT;

export const DropdownItemsList: FC = ({ children }) => (
    <DropdownMenu>
        <div className="max-h-custom overflow-hidden" style={{ '--max-h-custom': `${DROPDOWN_LIST_MAX_HEIGHT}rem` }}>
            <Scroll
                {...(Array.isArray(children) && children.length >= DROPDOWN_MAX_VISIBLE_ITEMS
                    ? { style: { height: `${DROPDOWN_LIST_MAX_HEIGHT}rem` } }
                    : {})}
            >
                {children}
            </Scroll>
        </div>
    </DropdownMenu>
);
