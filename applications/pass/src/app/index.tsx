import { createRoot } from 'react-dom/client';

import { fileStorage, fileStorageReady } from '@proton/pass/lib/file-storage/fs';
import '@proton/polyfill';
import { initSafariFontFixClassnames } from '@proton/shared/lib/helpers/initSafariFontFixClassnames';

import { App } from './App';
import './style';

initSafariFontFixClassnames();

void fileStorageReady.then(() => {
    fileStorage.attachGarbageCollector(localStorage);
    return fileStorage.gc?.clearLocalQueue();
});

const container = document.querySelector('.app-root');
const root = createRoot(container!);
root.render(<App />);
