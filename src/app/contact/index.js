import contactAddressInput from './directives/contactAddressInput';
import contactClear from './directives/contactClear';
import contactDetails from './directives/contactDetails';
import contactEncrypted from './directives/contactEncrypted';
import contactError from './directives/contactError';
import contactItem from './directives/contactItem';
import contactList from './directives/contactList';
import contactNoResult from './directives/contactNoResult';
import contactPlaceholder from './directives/contactPlaceholder';
import contactToolbar from './directives/contactToolbar';
import contactView from './directives/contactView';
import contactCache from './factories/contactCache';
import contactDetailsModel from './factories/contactDetailsModel';
import contactDownloader from './factories/contactDownloader';
import contactEditor from './factories/contactEditor';
import contactEmails from './factories/contactEmails';
import contactImporter from './factories/contactImporter';
import contactMerger from './factories/contactMerger';
import contactSchema from './factories/contactSchema';
import contactTransformLabel from './factories/contactTransformLabel';
import contactUI from './factories/contactUI';
import contact from './filters/contact';
import spam from './filters/spam';
import contactBeforeToLeaveModal from './modals/contactBeforeToLeaveModal';
import contactLoaderModal from './modals/contactLoaderModal';
import contactMergerModal from './modals/contactMergerModal';
import contactModal from './modals/contactModal';
import importContactModal from './modals/importContactModal';

export default angular
    .module('proton.contact', ['vs-repeat'])
    .run((contactEditor, contactMerger) => {
        contactEditor.init();
        contactMerger.init();
    })
    .config(($stateProvider) => {
        $stateProvider
            .state('secured.contacts', {
                url: '/contacts?sort&page&keyword',
                params: {
                    page: { value: null, squash: true },
                    keyword: { value: null, squash: true },
                    sort: { value: null, squash: true }
                },
                resolve: {
                    delinquent(user, isDelinquent) {
                        return isDelinquent();
                    }
                },
                views: {
                    'content@secured': {
                        template: '<contact-view></contact-view>'
                    }
                },
                onEnter(AppModel) {
                    AppModel.set('contactSidebar', true);
                },
                onExit(AppModel) {
                    AppModel.set('contactSidebar', false);
                }
            })
            .state('secured.contacts.details', {
                url: '/:id',
                params: { id: null },
                views: {
                    'details@secured.contacts': {
                        template:
                            '<div class="contactsDetails-body"><contact-details ng-if="contact" data-contact="contact"></contact-details><loader-tag></loader-tag></div>',
                        controller($scope, $stateParams, contactCache) {
                            contactCache.find($stateParams.id).then((data) =>
                                $scope.$applyAsync(() => {
                                    $scope.contact = data;
                                })
                            );
                        }
                    }
                }
            });
    })
    .directive('contactAddressInput', contactAddressInput)
    .directive('contactClear', contactClear)
    .directive('contactDetails', contactDetails)
    .directive('contactEncrypted', contactEncrypted)
    .directive('contactError', contactError)
    .directive('contactItem', contactItem)
    .directive('contactList', contactList)
    .directive('contactNoResult', contactNoResult)
    .directive('contactPlaceholder', contactPlaceholder)
    .directive('contactToolbar', contactToolbar)
    .directive('contactView', contactView)
    .factory('contactCache', contactCache)
    .factory('contactDetailsModel', contactDetailsModel)
    .factory('contactDownloader', contactDownloader)
    .factory('contactEditor', contactEditor)
    .factory('contactEmails', contactEmails)
    .factory('contactImporter', contactImporter)
    .factory('contactMerger', contactMerger)
    .factory('contactSchema', contactSchema)
    .factory('contactTransformLabel', contactTransformLabel)
    .factory('contactUI', contactUI)
    .filter('contact', contact)
    .filter('spam', spam)
    .factory('contactBeforeToLeaveModal', contactBeforeToLeaveModal)
    .factory('contactLoaderModal', contactLoaderModal)
    .factory('contactMergerModal', contactMergerModal)
    .factory('contactModal', contactModal)
    .factory('importContactModal', importContactModal).name;
