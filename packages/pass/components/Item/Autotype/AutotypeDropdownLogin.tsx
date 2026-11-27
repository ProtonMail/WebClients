import type { FC } from 'react';
import { useSelector } from 'react-redux';

import { useAutotypeActions } from '../../../hooks/autotype/useAutotypeActions';
import { selectUserAutoTypeAllowed } from '../../../store/selectors/user';
import { PassFeature } from '../../../types/api/features';
import type { Item } from '../../../types/data/items';
import { WithFeatureFlag } from '../../Core/WithFeatureFlag';
import { AutotypeDropdown } from './AutotypeDropdown';

type AutotypeDropdownLoginProps = {
    data: Item<'login'>;
    shareId: string;
};

const AutotypeDropdownLoginCore: FC<AutotypeDropdownLoginProps> = ({ data, shareId }) => {
    const { actions } = useAutotypeActions(data, shareId);
    const autoTypeAllowed = useSelector(selectUserAutoTypeAllowed);

    if (actions.length === 0 || !autoTypeAllowed) return null;

    return <AutotypeDropdown actions={actions} />;
};

export const AutotypeDropdownLogin = WithFeatureFlag(AutotypeDropdownLoginCore, PassFeature.PassDesktopAutotype);
