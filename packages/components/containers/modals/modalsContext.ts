import { createContext } from 'react';

import type { ModalManager } from './interface';

export default createContext<ModalManager>(null as unknown as ModalManager);
