import { isMainFrame } from './is-main-frame';

export const getRootBody = () => (isMainFrame() ? document.body : window.top?.document.body ?? document.body);
