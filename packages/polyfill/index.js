import 'core-js/stable';
import 'regenerator-runtime/runtime';
import { install } from 'resize-observer';

if (!window.ResizeObserver) {
    install();
}
