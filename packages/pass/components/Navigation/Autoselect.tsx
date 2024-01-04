import { type FC } from 'react';
import { Redirect } from 'react-router-dom';

import { useItems } from '@proton/pass/components/Item/Context/ItemsProvider';
import { useNavigation } from '@proton/pass/components/Navigation/NavigationProvider';
import { getItemRoute, preserveSearch } from '@proton/pass/components/Navigation/routing';

export const Autoselect: FC = () => {
    const { matchTrash } = useNavigation();
    const { filtered } = useItems();
    const autoselect = filtered[0];

    return autoselect ? (
        <Redirect
            exact
            to={preserveSearch(getItemRoute(autoselect.shareId, autoselect.itemId, matchTrash))}
            push={false}
        />
    ) : null;
};
