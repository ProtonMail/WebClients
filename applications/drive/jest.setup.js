import '@testing-library/jest-dom/extend-expect';
import { TextEncoder, TextDecoder } from 'util';

// Getting ReferenceError: TextDecoder is not defined without
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;
