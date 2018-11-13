import autocompleteEmailsModel from './factories/autocompleteEmailsModel';
import pageTitlesModel from './factories/pageTitlesModel';
import timepickerModel from './factories/timepickerModel';
import appVersion from './directives/appVersion';
import atomLoader from './directives/atomLoader';
import autocompleteEmail from './directives/autocompleteEmail';
import autocompleteEmails from './directives/autocompleteEmails';
import autocompleteEmailsItem from './directives/autocompleteEmailsItem';
import emailEncryptionIcon from './directives/emailEncryptionIcon';
import chooseLayoutBtns from './directives/chooseLayoutBtns';
import customCheckbox from './directives/customCheckbox';
import customRadio from './directives/customRadio';
import customTheme from './directives/customTheme';
import dateTimePicker from './directives/dateTimePicker';
import dropdown from './directives/dropdown';
import headerSecured from './directives/headerSecured';
import legends from './directives/legends';
import loaderTag from './directives/loaderTag';
import monthdayTimePicker from './directives/monthdayTimePicker';
import multiselect from './directives/multiselect';
import noResults from './directives/noResults';
import numberElementSelected from './directives/numberElementSelected';
import progressBar from './directives/progressBar';
import progressUpload from './directives/progressUpload';
import progressionBtn from './directives/progressionBtn';
import protonLoader from './directives/protonLoader';
import protonmailLogo from './directives/protonmailLogo';
import protonSvgs from './directives/protonSvgs';
import ptTooltip from './directives/ptTooltip';
import readUnread from './directives/readUnread';
import requestTimeout from './directives/requestTimeout';
import settingsMenu from './directives/settingsMenu';
import slider from './directives/slider';
import timePicker from './directives/timePicker';
import title from './directives/title';
import toggle from './directives/toggle';
import toggleExpand from './directives/toggleExpand';
import toolbarDesktop from './directives/toolbarDesktop';
import toolbarMobile from './directives/toolbarMobile';
import twitterLink from './directives/twitterLink';
import weekdayTimePicker from './directives/weekdayTimePicker';
import labelAutocomplete from './filters/labelAutocomplete';
import unescape from './filters/unescape';
import autocompleteBuilder from './services/autocompleteBuilder';
import emailsEncryptionFlags from './services/emailsEncryptionFlags';
import backState from './services/backState';
import consoleMessage from './services/consoleMessage';
import customInputCreator from './services/customInputCreator';
import datetimeErrorCombiner from './services/datetimeErrorCombiner';
import headerNoAuth from './directives/header/headerNoAuth';
import encryptionStatus from './services/encryptionStatus';
import dynamicStates from './factories/dynamicStates';
import mozInfo from './directives/mozInfo';
import headerSecuredDesktop from './directives/header/headerSecuredDesktop';
import headerSecuredMobile from './directives/header/headerSecuredMobile';
import arrowsToScroll from './directives/navigation/arrowsToScroll';
import navigation from './directives/navigation/navigation';
import navigationBlackFriday from './directives/navigation/navigationBlackFriday';
import navigationReport from './directives/navigation/navigationReport';
import navigationUser from './directives/navigation/navigationUser';

export default angular
    .module('proton.ui', [])
    .directive('mozInfo', mozInfo)
    .factory('dynamicStates', dynamicStates)
    .run((backState) => backState.init())
    .factory('encryptionStatus', encryptionStatus)
    .factory('autocompleteEmailsModel', autocompleteEmailsModel)
    .factory('pageTitlesModel', pageTitlesModel)
    .factory('timepickerModel', timepickerModel)
    .directive('appVersion', appVersion)
    .directive('atomLoader', atomLoader)
    .directive('autocompleteEmail', autocompleteEmail)
    .directive('autocompleteEmails', autocompleteEmails)
    .directive('autocompleteEmailsItem', autocompleteEmailsItem)
    .directive('emailEncryptionIcon', emailEncryptionIcon)
    .directive('chooseLayoutBtns', chooseLayoutBtns)
    .directive('customCheckbox', customCheckbox)
    .directive('customRadio', customRadio)
    .directive('customTheme', customTheme)
    .directive('dateTimePicker', dateTimePicker)
    .directive('dropdown', dropdown)
    .directive('headerSecured', headerSecured)
    .directive('legends', legends)
    .directive('loaderTag', loaderTag)
    .directive('monthdayTimePicker', monthdayTimePicker)
    .directive('multiselect', multiselect)
    .directive('noResults', noResults)
    .directive('numberElementSelected', numberElementSelected)
    .directive('progressBar', progressBar)
    .directive('progressUpload', progressUpload)
    .directive('progressionBtn', progressionBtn)
    .directive('protonLoader', protonLoader)
    .directive('protonmailLogo', protonmailLogo)
    .directive('protonSvgs', protonSvgs)
    .directive('ptTooltip', ptTooltip)
    .directive('readUnread', readUnread)
    .directive('requestTimeout', requestTimeout)
    .directive('settingsMenu', settingsMenu)
    .directive('slider', slider)
    .directive('timePicker', timePicker)
    .directive('title', title)
    .directive('toggle', toggle)
    .directive('toggleExpand', toggleExpand)
    .directive('toolbarDesktop', toolbarDesktop)
    .directive('toolbarMobile', toolbarMobile)
    .directive('twitterLink', twitterLink)
    .directive('weekdayTimePicker', weekdayTimePicker)
    .filter('labelAutocomplete', labelAutocomplete)
    .filter('unescape', unescape)
    .factory('autocompleteBuilder', autocompleteBuilder)
    .factory('emailsEncryptionFlags', emailsEncryptionFlags)
    .factory('backState', backState)
    .factory('consoleMessage', consoleMessage)
    .factory('customInputCreator', customInputCreator)
    .factory('datetimeErrorCombiner', datetimeErrorCombiner)
    .directive('headerNoAuth', headerNoAuth)
    .directive('headerSecuredDesktop', headerSecuredDesktop)
    .directive('headerSecuredMobile', headerSecuredMobile)
    .directive('arrowsToScroll', arrowsToScroll)
    .directive('navigation', navigation)
    .directive('navigationBlackFriday', navigationBlackFriday)
    .directive('navigationReport', navigationReport)
    .directive('navigationUser', navigationUser).name;
