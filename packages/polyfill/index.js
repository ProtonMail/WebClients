import 'core-js/stable';
import 'core-js/proposals/array-buffer-base64';
import 'regenerator-runtime/runtime';
import { install } from 'resize-observer';

if (!window.ResizeObserver) {
    install();
}
