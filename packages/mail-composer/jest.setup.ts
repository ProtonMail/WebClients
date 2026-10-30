import '@testing-library/jest-dom/jest-globals';
import { TextDecoder, TextEncoder } from 'util';

// jsdom does not provide them, and @protontech/crypto needs them
Object.assign(global, { TextDecoder, TextEncoder });
