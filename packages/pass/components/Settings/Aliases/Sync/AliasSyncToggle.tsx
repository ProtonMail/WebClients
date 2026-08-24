import type { FC } from 'react';
import { useSelector } from 'react-redux';

import { selectCanCreateItems, selectUserState } from '../../../../store/selectors';
import { AliasSyncDisabled } from './AliasSyncDisabled';
import { AliasSyncEnabled } from './AliasSyncEnabled';

export const AliasSyncToggle: FC = () => {
    const { userData } = useSelector(selectUserState);
    const canCreateItems = useSelector(selectCanCreateItems);

    if (!canCreateItems) return null;

    return userData?.aliasSyncEnabled ? <AliasSyncEnabled /> : <AliasSyncDisabled />;
};
