import type { FC } from 'react';
import { useSelector } from 'react-redux';

import { AliasSyncDisabled } from '@proton/pass/components/Settings/Aliases/Sync/AliasSyncDisabled';
import { AliasSyncEnabled } from '@proton/pass/components/Settings/Aliases/Sync/AliasSyncEnabled';
import { selectCanCreateItems, selectUserState } from '@proton/pass/store/selectors';

export const AliasSyncToggle: FC = () => {
    const { userData } = useSelector(selectUserState);
    const canCreateItems = useSelector(selectCanCreateItems);

    if (!canCreateItems) return null;

    return userData?.aliasSyncEnabled ? <AliasSyncEnabled /> : <AliasSyncDisabled />;
};
