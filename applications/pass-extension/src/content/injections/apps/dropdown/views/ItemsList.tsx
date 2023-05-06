import type { VFC } from 'react';

import { SafeLoginItem } from '@proton/pass/types';

import { DropdownItem } from '../components/DropdownItem';
import { DropdownItemsList } from '../components/DropdownItemsList';

export const ItemsList: VFC<{ items: SafeLoginItem[]; onSubmit: (item: SafeLoginItem) => void }> = ({
    items,
    onSubmit,
}) => {
    return (
        <DropdownItemsList>
            {items.map((item) => (
                <DropdownItem
                    key={item.itemId}
                    icon="key"
                    title={item.name}
                    subTitle={item.username}
                    onClick={() => onSubmit(item)}
                />
            ))}
        </DropdownItemsList>
    );
};
