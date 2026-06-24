/* eslint-env jest */
import type log from 'loglevel';

const loglevel = jest.createMockFromModule<typeof log>('loglevel');
loglevel.getLogger = jest.fn(() => loglevel);

export default loglevel;
