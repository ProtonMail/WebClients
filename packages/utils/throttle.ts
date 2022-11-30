import { throttle } from 'lodash';

/**
 * Creates a throttled function that only invokes `func` at most
 * once per every `wait` milliseconds.
 */
export default throttle;
