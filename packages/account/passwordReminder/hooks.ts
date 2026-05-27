import { useSelector } from '@proton/redux-shared-store/sharedProvider';

import { selectPasswordReminder } from './index';

export const usePasswordReminder = () => {
    return useSelector(selectPasswordReminder);
};
