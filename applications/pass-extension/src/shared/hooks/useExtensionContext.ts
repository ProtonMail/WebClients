import { useContext } from 'react';

import { ExtensionAppContext } from '../components/extension/ExtensionContext';

export const useExtensionContext = () => useContext(ExtensionAppContext);
