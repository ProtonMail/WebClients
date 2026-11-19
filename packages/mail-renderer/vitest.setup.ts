import '@testing-library/jest-dom/vitest';
import { TextDecoder, TextEncoder } from 'util';

// Needed for tests using JSDOM classes (ie. new JSDOM())
Object.assign(globalThis, { TextDecoder, TextEncoder });
