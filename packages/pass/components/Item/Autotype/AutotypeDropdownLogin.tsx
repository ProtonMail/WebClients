import type { FC } from 'react';
import { useSelector } from 'react-redux';

import { useAutotypeActions } from '../../../hooks/autotype/useAutotypeActions';
import { selectUserPlan } from '../../../store/selectors/user';
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
    const isPassEssentials = useSelector(selectUserPlan)?.InternalName === 'passpro2024';

    if (actions.length === 0 || isPassEssentials) return null;

    return <AutotypeDropdown actions={actions} />;
};

export const AutotypeDropdownLogin = WithFeatureFlag(AutotypeDropdownLoginCore, PassFeature.PassDesktopAutotype);
