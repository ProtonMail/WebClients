import 'core-js/stable';
import 'regenerator-runtime/runtime';
import 'yetch/polyfill';
import { install } from 'resize-observer';

if (!window.ResizeObserver) {
    install();
}
