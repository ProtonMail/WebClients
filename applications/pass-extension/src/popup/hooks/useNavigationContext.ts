import { useContext } from 'react';

import { NavigationContext } from '../context/navigation/NavigationContext';

export const useNavigationContext = () => useContext(NavigationContext);
