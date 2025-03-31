import { createRoot } from 'react-dom/client';

import { fileStorage } from '@proton/pass/lib/file-storage/fs';
import { initElectronClassnames } from '@proton/shared/lib/helpers/initElectronClassnames';

import { App } from './App';
import reportClientLaunch from './reportClientLaunch';

initElectronClassnames();
void reportClientLaunch();

fileStorage.attachGarbageCollector(localStorage);
void fileStorage.clearAll();

const container = document.querySelector('.app-root');
const root = createRoot(container!);

root.render(<App />);
