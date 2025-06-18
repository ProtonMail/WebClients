import { type FC } from 'react';

import { AutotypeDropdown } from '@proton/pass/components/Item/Autotype/AutotypeDropdown';
import { useAutotypeActions } from '@proton/pass/hooks/autotype/useAutotypeActions';
import { useFeatureFlag } from '@proton/pass/hooks/useFeatureFlag';
import type { Item } from '@proton/pass/types';
import { PassFeature } from '@proton/pass/types/api/features';

type AutotypeDropdownLoginProps = {
    data: Item<'login'>;
};

export const AutotypeDropdownLogin: FC<AutotypeDropdownLoginProps> = ({ data }) => {
    const autotypeEnabled = useFeatureFlag(PassFeature.PassDesktopAutotype);
    const { actions } = useAutotypeActions(data);

    if (!autotypeEnabled || actions.length === 0) return null;

    return <AutotypeDropdown actions={actions} />;
};
