import { useContext } from 'react';

import { NavigationContext } from 'proton-pass-extension/lib/components/Context/Navigation/NavigationContext';

export const useNavigationContext = () => useContext(NavigationContext);
