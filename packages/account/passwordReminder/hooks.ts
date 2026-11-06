import { useSelector } from '../store/hooks';
import { selectPasswordReminder } from './index';

export const usePasswordReminder = () => {
    return useSelector(selectPasswordReminder);
};
