import { useContext } from 'react';

import { ExtensionConnectContext } from '../components/Extension/ExtensionConnect';

export const useExtensionConnectContext = () => useContext(ExtensionConnectContext);
