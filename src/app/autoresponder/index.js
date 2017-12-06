import autoresponder from './directives/autoresponder';
import autoresponderMessage from './directives/autoresponderMessage';
import autoresponderTimePicker from './directives/autoresponderTimePicker';
import autoresponderTimeSection from './directives/autoresponderTimeSection';
import autoresponderView from './directives/autoresponderView';
import durationselect from './directives/durationselect';
import zoneselect from './directives/zoneselect';
import autoresponderModel from './factories/autoresponderModel';
import autoresponderLanguage from './services/autoresponderLanguage';

export default angular
    .module('proton.autoresponder', [])
    .directive('autoresponder', autoresponder)
    .directive('autoresponderMessage', autoresponderMessage)
    .directive('autoresponderTimePicker', autoresponderTimePicker)
    .directive('autoresponderTimeSection', autoresponderTimeSection)
    .directive('autoresponderView', autoresponderView)
    .directive('durationselect', durationselect)
    .directive('zoneselect', zoneselect)
    .factory('autoresponderModel', autoresponderModel)
    .factory('autoresponderLanguage', autoresponderLanguage).name;
