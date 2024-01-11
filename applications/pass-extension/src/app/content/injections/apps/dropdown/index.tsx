import { createRoot } from 'react-dom/client';

import { Dropdown } from './Dropdown';

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(<Dropdown />);
