import autocompleteEmailsModel from './factories/autocompleteEmailsModel';
import pageTitlesModel from './factories/pageTitlesModel';
import appVersion from './directives/appVersion';
import atomLoader from './directives/atomLoader';
import autocompleteEmail from './directives/autocompleteEmail';
import autocompleteEmails from './directives/autocompleteEmails';
import autocompleteEmailsItem from './directives/autocompleteEmailsItem';
import emailEncryptionIcon from './directives/emailEncryptionIcon';
import currencySelector from './directives/currencySelector';
import customCheckbox from './directives/customCheckbox';
import customRadio from './directives/customRadio';
import customTheme from './directives/customTheme';
import headerSecured from './directives/headerSecured';
import icons from './directives/icons';
import icon from './directives/icon';
import legends from './directives/legends';
import loaderTag from './directives/loaderTag';
import multiselect from './directives/multiselect';
import noResults from './directives/noResults';
import progressBar from './directives/progressBar';
import progressUpload from './directives/progressUpload';
import progressionBtn from './directives/progressionBtn';
import protonLoader from './directives/protonLoader';
import protonmailLogo from './directives/protonmailLogo';
import protonSvgs from './directives/protonSvgs';
import ptTooltip from './directives/ptTooltip';
import readUnread from './directives/readUnread';
import requestTimeout from './directives/requestTimeout';
import slider from './directives/slider';
import title from './directives/title';
import toggle from './directives/toggle';
import toggleExpand from './directives/toggleExpand';
import toolbarDesktop from './directives/toolbarDesktop';
import toolbarMobile from './directives/toolbarMobile';
import twitterLink from './directives/twitterLink';
import labelAutocomplete from './filters/labelAutocomplete';
import unescape from './filters/unescape';
import autocompleteBuilder from './services/autocompleteBuilder';
import emailsEncryptionFlags from './services/emailsEncryptionFlags';
import backState from './services/backState';
import consoleMessage from './services/consoleMessage';
import customInputCreator from './services/customInputCreator';
import headerNoAuth from './directives/header/headerNoAuth';
import encryptionStatus from './services/encryptionStatus';
import dynamicStates from './factories/dynamicStates';
import initials from './filters/initials';
import dropdownContainer from './directives/dropdownContainer';
import dropdownButton from './directives/dropdownButton';
import dropdownContent from './directives/dropdownContent';
import toogleModeElementsDropdown from './directives/toogleModeElementsDropdown';
import sortViewDropdown from './directives/sortViewDropdown';
import onboardingModal from './modals/onboardingModal';
import viewTitle from './directives/viewTitle';
import headerSecuredDesktop from './directives/header/headerSecuredDesktop';
import headerSecuredMobile from './directives/header/headerSecuredMobile';
import navigation from './directives/navigation/navigation';
import navigationBlackFriday from './directives/navigation/navigationBlackFriday';
import navigationUser from './directives/navigation/navigationUser';

export default angular
    .module('proton.ui', [])
    .directive('viewTitle', viewTitle)
    .factory('onboardingModal', onboardingModal)
    .directive('sortViewDropdown', sortViewDropdown)
    .directive('toogleModeElementsDropdown', toogleModeElementsDropdown)
    .directive('dropdownContent', dropdownContent)
    .directive('dropdownButton', dropdownButton)
    .directive('dropdownContainer', dropdownContainer)
    .filter('initials', initials)
    .factory('dynamicStates', dynamicStates)
    .run((backState) => backState.init())
    .factory('encryptionStatus', encryptionStatus)
    .factory('autocompleteEmailsModel', autocompleteEmailsModel)
    .factory('pageTitlesModel', pageTitlesModel)
    .directive('appVersion', appVersion)
    .directive('atomLoader', atomLoader)
    .directive('autocompleteEmail', autocompleteEmail)
    .directive('autocompleteEmails', autocompleteEmails)
    .directive('autocompleteEmailsItem', autocompleteEmailsItem)
    .directive('emailEncryptionIcon', emailEncryptionIcon)
    .directive('currencySelector', currencySelector)
    .directive('customCheckbox', customCheckbox)
    .directive('customRadio', customRadio)
    .directive('customTheme', customTheme)
    .directive('headerSecured', headerSecured)
    .directive('icons', icons)
    .directive('icon', icon)
    .directive('legends', legends)
    .directive('loaderTag', loaderTag)
    .directive('multiselect', multiselect)
    .directive('noResults', noResults)
    .directive('progressBar', progressBar)
    .directive('progressUpload', progressUpload)
    .directive('progressionBtn', progressionBtn)
    .directive('protonLoader', protonLoader)
    .directive('protonmailLogo', protonmailLogo)
    .directive('protonSvgs', protonSvgs)
    .directive('ptTooltip', ptTooltip)
    .directive('readUnread', readUnread)
    .directive('requestTimeout', requestTimeout)
    .directive('slider', slider)
    .directive('title', title)
    .directive('toggle', toggle)
    .directive('toggleExpand', toggleExpand)
    .directive('toolbarDesktop', toolbarDesktop)
    .directive('toolbarMobile', toolbarMobile)
    .directive('twitterLink', twitterLink)
    .filter('labelAutocomplete', labelAutocomplete)
    .filter('unescape', unescape)
    .factory('autocompleteBuilder', autocompleteBuilder)
    .factory('emailsEncryptionFlags', emailsEncryptionFlags)
    .factory('backState', backState)
    .factory('consoleMessage', consoleMessage)
    .factory('customInputCreator', customInputCreator)
    .directive('headerNoAuth', headerNoAuth)
    .directive('headerSecuredDesktop', headerSecuredDesktop)
    .directive('headerSecuredMobile', headerSecuredMobile)
    .directive('navigation', navigation)
    .directive('navigationBlackFriday', navigationBlackFriday)
    .directive('navigationUser', navigationUser).name;
