import analytics from './services/analytics';
import eventListener from './services/eventListener';

export default angular
    .module('proton.analytics', [])
    .run((analytics, eventListener) => {
        analytics.init();
        eventListener.init();
    })
    .factory('analytics', analytics)
    .factory('eventListener', eventListener).name;
