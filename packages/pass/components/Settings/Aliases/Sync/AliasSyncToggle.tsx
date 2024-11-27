import { type FC } from 'react';
import { useSelector } from 'react-redux';

import { AliasSyncDisabled } from '@proton/pass/components/Settings/Aliases/Sync/AliasSyncDisabled';
import { AliasSyncEnabled } from '@proton/pass/components/Settings/Aliases/Sync/AliasSyncEnabled';
import { selectUserState } from '@proton/pass/store/selectors';

export const AliasSyncToggle: FC = () => {
    const { userData } = useSelector(selectUserState);
    return userData?.aliasSyncEnabled ? <AliasSyncEnabled /> : <AliasSyncDisabled />;
};
