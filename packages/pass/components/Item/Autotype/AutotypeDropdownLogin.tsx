import type { FC } from 'react';

import { WithFeatureFlag } from '@proton/pass/components/Core/WithFeatureFlag';
import { AutotypeDropdown } from '@proton/pass/components/Item/Autotype/AutotypeDropdown';
import { useAutotypeActions } from '@proton/pass/hooks/autotype/useAutotypeActions';
import type { Item } from '@proton/pass/types';
import { PassFeature } from '@proton/pass/types/api/features';

type AutotypeDropdownLoginProps = {
    data: Item<'login'>;
};

export const AutotypeDropdownLoginCore: FC<AutotypeDropdownLoginProps> = ({ data }) => {
    const { actions } = useAutotypeActions(data);
    if (actions.length === 0) return null;

    return <AutotypeDropdown actions={actions} />;
};

export const AutotypeDropdownLogin = WithFeatureFlag(AutotypeDropdownLoginCore, PassFeature.PassDesktopAutotype);
