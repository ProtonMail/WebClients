import type { FC } from 'react';
import { useSelector } from 'react-redux';

import { useAutotypeActions } from '../../../hooks/autotype/useAutotypeActions';
import { selectUserPlan } from '../../../store/selectors';
import type { Item } from '../../../types';
import { PassFeature } from '../../../types/api/features';
import { WithFeatureFlag } from '../../Core/WithFeatureFlag';
import { AutotypeDropdown } from './AutotypeDropdown';

type AutotypeDropdownLoginProps = {
    data: Item<'login'>;
};

export const AutotypeDropdownLoginCore: FC<AutotypeDropdownLoginProps> = ({ data }) => {
    const { actions } = useAutotypeActions(data);
    const isPassEssentials = useSelector(selectUserPlan)?.InternalName === 'passpro2024';

    if (actions.length === 0 || isPassEssentials) return null;

    return <AutotypeDropdown actions={actions} />;
};

export const AutotypeDropdownLogin = WithFeatureFlag(AutotypeDropdownLoginCore, PassFeature.PassDesktopAutotype);
