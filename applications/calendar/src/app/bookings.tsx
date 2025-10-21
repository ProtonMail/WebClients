import { createRoot } from 'react-dom/client';

import '@proton/polyfill';

import { BookingsApp } from './bookings/BookingsPageContainer';
import './style';

const container = document.querySelector('.app-root');
const root = createRoot(container!);
root.render(<BookingsApp />);
