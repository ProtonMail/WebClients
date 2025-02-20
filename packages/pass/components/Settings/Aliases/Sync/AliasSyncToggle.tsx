import { type FC } from 'react';
import { useSelector } from 'react-redux';

import { AliasSyncDisabled } from '@proton/pass/components/Settings/Aliases/Sync/AliasSyncDisabled';
import { AliasSyncEnabled } from '@proton/pass/components/Settings/Aliases/Sync/AliasSyncEnabled';
import { selectHasWritableVault, selectUserState } from '@proton/pass/store/selectors';

export const AliasSyncToggle: FC = () => {
    const { userData } = useSelector(selectUserState);
    const canSync = useSelector(selectHasWritableVault);

    if (!canSync) return null;

    return userData?.aliasSyncEnabled ? <AliasSyncEnabled /> : <AliasSyncDisabled />;
};
