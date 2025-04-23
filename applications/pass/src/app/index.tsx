import { createRoot } from 'react-dom/client';

import { fileStorageReady } from '@proton/pass/lib/file-storage/fs';
import '@proton/polyfill';
import { initSafariFontFixClassnames } from '@proton/shared/lib/helpers/initSafariFontFixClassnames';

import { App } from './App';
import './style';

initSafariFontFixClassnames();

void fileStorageReady.then((instance) => {
    /** Clear only the GC queue on startup to handle multiple
     * concurrent sessions across browser tabs */
    instance.attachGarbageCollector(localStorage);
    return instance.gc?.clearQueue();
});

const container = document.querySelector('.app-root');
const root = createRoot(container!);
root.render(<App />);
