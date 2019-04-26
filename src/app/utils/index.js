import detectTimeWidth from './directives/detectTimeWidth';
import dropzone from './directives/dropzone';
import timeRefreshed from './directives/timeRefreshed';
import reloadState from './directives/reloadState';
import askPassword from './factories/askPassword';
import chunk from './factories/chunk';
import dateUtils from './factories/dateUtils';
import desktopNotifications from './factories/desktopNotifications';
import requestFormData from './factories/requestFormData';
import resurrecter from './factories/resurrecter';
import tools from './factories/tools';
import goAndReload from './factories/goAndReload';
import bytes from './filters/bytes';
import capitalize from './filters/capitalize';
import currency from './filters/currency';
import delay from './filters/delay';
import fixed from './filters/fixed';
import humanSize from './filters/humanSize';
import localReadableTime from './filters/localReadableTime';
import longReadableTime from './filters/longReadableTime';
import number from './filters/number';
import percentage from './filters/percentage';
import readableTime from './filters/readableTime';
import utcReadableTime from './filters/utcReadableTime';
import eventManager from './services/eventManager';
import hotkeys from './services/hotkeys';
import openStatePostMessage from './services/openStatePostMessage';
import firstLoadState from './services/firstLoadState';
import lazyLoader from './services/lazyLoader';
import sanitize from './services/sanitize';
import linkHandler from './directives/linkHandler';
import mailUtils from './services/mailUtils';
import discardModal from './modals/discardModal';
import linkWarningModal from './modals/linkWarningModal';
import formatURL from './filters/formatURL';
import formatBDay from './filters/formatBDay';
import printModal from './modals/printModal';
import printMessage from './directives/printMessage';
import printMessageModel from './factories/printMessageModel';

export default angular
    .module('proton.utils', [])
    .factory('printMessageModel', printMessageModel)
    .directive('printMessage', printMessage)
    .factory('printModal', printModal)
    .filter('formatURL', formatURL)
    .filter('formatBDay', formatBDay)
    .factory('discardModal', discardModal)
    .factory('linkWarningModal', linkWarningModal)
    .factory('mailUtils', mailUtils)
    .directive('linkHandler', linkHandler)
    .service('lazyLoader', lazyLoader)
    .directive('detectTimeWidth', detectTimeWidth)
    .directive('dropzone', dropzone)
    .directive('timeRefreshed', timeRefreshed)
    .directive('reloadState', reloadState)
    .factory('askPassword', askPassword)
    .factory('chunk', chunk)
    .factory('dateUtils', dateUtils)
    .factory('desktopNotifications', desktopNotifications)
    .factory('firstLoadState', firstLoadState)
    .factory('requestFormData', requestFormData)
    .factory('resurrecter', resurrecter)
    .factory('tools', tools)
    .factory('goAndReload', goAndReload)
    .filter('bytes', bytes)
    .filter('capitalize', capitalize)
    .filter('currency', currency)
    .filter('delay', delay)
    .filter('fixed', fixed)
    .filter('humanSize', humanSize)
    .filter('localReadableTime', localReadableTime)
    .filter('longReadableTime', longReadableTime)
    .filter('number', number)
    .filter('percentage', percentage)
    .filter('readableTime', readableTime)
    .filter('utcReadableTime', utcReadableTime)
    .factory('eventManager', eventManager)
    .factory('hotkeys', hotkeys)
    .factory('openStatePostMessage', openStatePostMessage)
    .factory('sanitize', sanitize).name;
