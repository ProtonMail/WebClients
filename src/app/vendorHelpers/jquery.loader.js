// Needed beacuse imports are hoisted, and other imports require jquery to exist globally.
import $ from 'jquery';

window.$ = $;
window.jQuery = $;
