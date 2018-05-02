import _ from 'lodash';
import { MOBILE_BREAKPOINT, DESKTOP_BREAKPOINT, MAILBOX_IDENTIFIERS, MESSAGE_VIEW_MODE } from '../../constants';

/* @ngInject */
function tools($state, $stateParams, mailSettingsModel, AppModel) {
    const MAILBOX_KEYS = Object.keys(MAILBOX_IDENTIFIERS);

    /**
     * Generate a hash
     * @param  {String} str
     * @return {Integer}
     */
    const hash = (str = '') => {
        // bitwise or with 0 ( | 0) makes sure we are using integer arithmetic and not floating point arithmetic
        return str.split('').reduce((prevHash, currVal) => (prevHash * 31 + currVal.charCodeAt(0)) | 0);
    };

    const mobileResponsive = () => {
        AppModel.set('mobile', document.body.offsetWidth < MOBILE_BREAKPOINT);
        AppModel.set(
            'tablet',
            document.body.offsetWidth < DESKTOP_BREAKPOINT && document.body.offsetWidth > MOBILE_BREAKPOINT
        );
    };

    const colors = () => {
        return [
            '#7272a7',
            '#8989ac',

            '#cf5858',
            '#cf7e7e',

            '#c26cc7',
            '#c793ca',

            '#7569d1',
            '#9b94d1',

            '#69a9d1',
            '#a8c4d5',

            '#5ec7b7',
            '#97c9c1',

            '#72bb75',
            '#9db99f',

            '#c3d261',
            '#c6cd97',

            '#e6c04c',
            '#e7d292',

            '#e6984c',
            '#dfb286'
        ];
    };

    /**
     * Remove every protonmail attributes inside the HTML content specified
     * @param {} html
     */
    const fixImages = (input) => {
        const re = new RegExp('proton-(url|src|svg|background|poster)', 'g');
        return input.replace(re, '$1');
    };

    const replaceLineBreaks = (content) => {
        return content.replace(/(?:\r\n|\r|\n)/g, '<br />');
    };

    const currentLocation = () => {
        const mailbox = currentMailbox();
        const loc = mailbox === 'label' ? $stateParams.label : MAILBOX_IDENTIFIERS[mailbox];

        return loc;
    };

    const filteredState = (state = $state.$current.name) => state.replace('secured.', '').replace('.element', '');

    function currentMailbox() {
        const mailbox = filteredState();

        if (_.includes(MAILBOX_KEYS, mailbox)) {
            return mailbox;
        }

        return false;
    }

    const getTypeList = (name) => {
        const specialBoxes = ['drafts', 'search', 'sent', 'allDrafts', 'allSent'];
        const box = name || currentMailbox();
        const { ViewMode } = mailSettingsModel.get();
        const threadingIsOff = ViewMode === MESSAGE_VIEW_MODE;

        if (threadingIsOff || _.includes(specialBoxes, box)) {
            return 'message';
        }

        return 'conversation';
    };

    const typeView = () => {
        const { ViewMode } = mailSettingsModel.get();
        return ViewMode === MESSAGE_VIEW_MODE ? 'message' : 'conversation';
    };

    /**
     * Check if the request is in a cache context
     * @return {Boolean}
     */
    const cacheContext = () => {
        const mailbox = filteredState();
        const filterUndefined = angular.isUndefined($stateParams.filter);
        const sortUndefined = angular.isUndefined($stateParams.sort);
        const isNotSearch = mailbox !== 'search';

        return isNotSearch && sortUndefined && filterUndefined;
    };

    return {
        hash,
        mobileResponsive,
        colors,
        fixImages,
        replaceLineBreaks,
        currentLocation,
        filteredState,
        currentMailbox,
        getTypeList,
        typeView,
        cacheContext
    };
}
export default tools;
