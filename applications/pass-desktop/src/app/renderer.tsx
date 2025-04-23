import { createRoot } from 'react-dom/client';

import { fileStorageReady } from '@proton/pass/lib/file-storage/fs';
import { initElectronClassnames } from '@proton/shared/lib/helpers/initElectronClassnames';

import { App } from './App';
import reportClientLaunch from './reportClientLaunch';

initElectronClassnames();
void reportClientLaunch();

void fileStorageReady.then((instance) => {
    /** The desktop app runs a single user session, as such it is safe
     * to clear storage on startup to complete pending deletions */
    instance.attachGarbageCollector(localStorage);
    return instance.clearAll();
});

const container = document.querySelector('.app-root');
const root = createRoot(container!);

root.render(<App />);
