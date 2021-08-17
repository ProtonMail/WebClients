import { createContext } from 'react';
import { ModalManager } from './interface';

export default createContext<ModalManager>(null as unknown as ModalManager);
