import '@testing-library/jest-dom';
import { configure } from '@testing-library/react';

const { getComputedStyle } = window;

window.getComputedStyle = (elt) => getComputedStyle(elt);

configure({ testIdAttribute: 'data-test-id' });
