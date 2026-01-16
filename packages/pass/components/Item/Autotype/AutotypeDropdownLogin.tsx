import type { FC } from 'react';
import { useSelector } from 'react-redux';

import { WithFeatureFlag } from '@proton/pass/components/Core/WithFeatureFlag';
import { AutotypeDropdown } from '@proton/pass/components/Item/Autotype/AutotypeDropdown';
import { useAutotypeActions } from '@proton/pass/hooks/autotype/useAutotypeActions';
import { selectUserPlan } from '@proton/pass/store/selectors';
import type { Item } from '@proton/pass/types';
import { PassFeature } from '@proton/pass/types/api/features';

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
