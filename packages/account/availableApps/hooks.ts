import { useSelector } from '../store/hooks';
import { selectAvailableApps } from './index';

/**
 * The apps the user can switch to, in app switcher order, as the API last listed them. None until it first answers.
 * They're fetched at bootstrap, and refreshed with fetchAvailableApps.
 */
export const useAvailableApps = () => useSelector(selectAvailableApps);
