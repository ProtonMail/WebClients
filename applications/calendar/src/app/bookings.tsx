import { createRoot } from 'react-dom/client';

import '@proton/polyfill';

import { BookingsEntry } from './bookings/entryPoints/BookingsEntry';
import './style';

const container = document.querySelector('.app-root');
const root = createRoot(container!);
root.render(<BookingsEntry />);
