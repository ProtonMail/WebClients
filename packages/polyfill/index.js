import 'core-js/stable';
import 'regenerator-runtime/runtime';
import { install } from 'resize-observer';
import 'yetch/polyfill';

if (!window.ResizeObserver) {
    install();
}
