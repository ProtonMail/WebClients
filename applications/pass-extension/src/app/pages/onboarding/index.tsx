import { createRoot } from 'react-dom/client';

import '@proton/pass/styles/common.scss';

import { Onboarding } from './Onboarding';

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(<Onboarding />);
