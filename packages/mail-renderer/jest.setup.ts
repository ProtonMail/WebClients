import '@testing-library/jest-dom/jest-globals';
import { TextDecoder, TextEncoder } from 'util';

// Needed for tests using JSDOM classes (ie. new JSDOM())
Object.assign(global, { TextDecoder, TextEncoder });
