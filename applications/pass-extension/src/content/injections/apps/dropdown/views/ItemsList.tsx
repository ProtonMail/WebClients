import type { VFC } from 'react';

import { SafeLoginItem } from '@proton/pass/types';

import { IFrameMessageType } from '../../../../types';
import { useIFrameContext } from '../../context/IFrameContextProvider';
import { DropdownItem } from '../components/DropdownItem';
import { DropdownItemsList } from '../components/DropdownItemsList';

export const ItemsList: VFC<{ items: SafeLoginItem[] }> = ({ items }) => {
    const { postMessage } = useIFrameContext();

    return (
        <DropdownItemsList>
            {items.map((item) => (
                <DropdownItem
                    key={item.itemId}
                    icon="key"
                    title={item.name}
                    subTitle={item.username}
                    onClick={() =>
                        postMessage({
                            type: IFrameMessageType.DROPDOWN_AUTOFILL_LOGIN,
                            payload: { item },
                        })
                    }
                />
            ))}
        </DropdownItemsList>
    );
};
