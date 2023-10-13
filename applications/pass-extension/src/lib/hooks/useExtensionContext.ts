import { useContext } from 'react';

import { ExtensionAppContext } from '../components/Extension/ExtensionContext';

export const useExtensionContext = () => useContext(ExtensionAppContext);
