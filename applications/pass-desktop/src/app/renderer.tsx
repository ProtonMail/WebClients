import { createRoot } from 'react-dom/client';

import { initElectronClassnames } from '@proton/shared/lib/helpers/initElectronClassnames';

import { App } from './App';

initElectronClassnames();

const container = document.querySelector('.app-root');
const root = createRoot(container!);
root.render(<App />);
