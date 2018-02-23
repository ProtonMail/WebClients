import Contact from './services/contact';
import contactAddressInput from './directives/contactAddressInput';
import contactPhotoRow from './directives/contactPhotoRow';
import contactClear from './directives/contactClear';
import contactDetails from './directives/contactDetails';
import contactDisplay from './directives/contactDisplay';
import contactDisplayModal from './modals/contactDisplayModal';
import contactPhotoModal from './modals/contactPhotoModal';
import contactPhotoForm from './directives/contactPhotoForm';
import contactEncrypted from './directives/contactEncrypted';
import contactError from './directives/contactError';
import contactItem from './directives/contactItem';
import contactArrowsSort from './directives/contactArrowsSort';
import contactList from './directives/contactList';
import contactMerger from './directives/contactMerger';
import contactNoResult from './directives/contactNoResult';
import contactPlaceholder from './directives/contactPlaceholder';
import contactToolbar from './directives/contactToolbar';
import contactView from './directives/contactView';
import contactRightPanel from './directives/contactRightPanel';
import contactCache from './factories/contactCache';
import contactDetailsModel from './factories/contactDetailsModel';
import contactDownloader from './factories/contactDownloader';
import contactEditor from './factories/contactEditor';
import contactEmails from './factories/contactEmails';
import contactImporter from './factories/contactImporter';
import contactMergerFactory from './factories/contactMerger';
import contactSchema from './factories/contactSchema';
import contactEncryption from './factories/contactEncryption';
import contactTransformLabel from './factories/contactTransformLabel';
import contactUI from './factories/contactUI';
import contactFilter from './filters/contact';
import spam from './filters/spam';
import contactBeforeToLeaveModal from './modals/contactBeforeToLeaveModal';
import contactLoaderModal from './modals/contactLoaderModal';
import contactMergerModal from './modals/contactMergerModal';
import contactModal from './modals/contactModal';
import importContactModal from './modals/importContactModal';
import importCardDropzone from './directives/importCardDropzone';

export default angular
    .module('proton.contact', ['vs-repeat'])
    .directive('importCardDropzone', importCardDropzone)
    .run((contactEditor, contactMerger) => {
        contactEditor.init();
        contactMerger.init();
    })
    .directive('contactAddressInput', contactAddressInput)
    .directive('contactPhotoRow', contactPhotoRow)
    .directive('contactClear', contactClear)
    .directive('contactDisplay', contactDisplay)
    .directive('contactDetails', contactDetails)
    .directive('contactMerger', contactMerger)
    .directive('contactEncrypted', contactEncrypted)
    .directive('contactError', contactError)
    .directive('contactItem', contactItem)
    .directive('contactArrowsSort', contactArrowsSort)
    .directive('contactList', contactList)
    .directive('contactNoResult', contactNoResult)
    .directive('contactPlaceholder', contactPlaceholder)
    .directive('contactToolbar', contactToolbar)
    .directive('contactView', contactView)
    .directive('contactRightPanel', contactRightPanel)
    .directive('contactPhotoForm', contactPhotoForm)
    .factory('Contact', Contact)
    .factory('contactCache', contactCache)
    .factory('contactDetailsModel', contactDetailsModel)
    .factory('contactDisplayModal', contactDisplayModal)
    .factory('contactPhotoModal', contactPhotoModal)
    .factory('contactDownloader', contactDownloader)
    .factory('contactEditor', contactEditor)
    .factory('contactEmails', contactEmails)
    .factory('contactImporter', contactImporter)
    .factory('contactMerger', contactMergerFactory)
    .factory('contactSchema', contactSchema)
    .factory('contactTransformLabel', contactTransformLabel)
    .factory('contactUI', contactUI)
    .factory('contactEncryption', contactEncryption)
    .filter('contact', contactFilter)
    .filter('spam', spam)
    .factory('contactBeforeToLeaveModal', contactBeforeToLeaveModal)
    .factory('contactLoaderModal', contactLoaderModal)
    .factory('contactMergerModal', contactMergerModal)
    .factory('contactModal', contactModal)
    .factory('importContactModal', importContactModal).name;
