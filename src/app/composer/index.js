import ComposeMessageController from './controllers/composeMessage';
import actionCompose from './directives/actionCompose';
import btnSendMessage from './directives/btnSendMessage';
import composer from './directives/composer';
import composerAskEmbedded from './directives/composerAskEmbedded';
import composerAttachments from './directives/composerAttachments';
import composerAttachmentsItem from './directives/composerAttachmentsItem';
import composerAttachmentsSize from './directives/composerAttachmentsSize';
import composerContainer from './directives/composerContainer';
import composerDropzone from './directives/composerDropzone';
import composerEncrypt from './directives/composerEncrypt';
import composerExpiration from './directives/composerExpiration';
import composerHeader from './directives/composerHeader';
import composerInputMeta from './directives/composerInputMeta';
import composerInputRecipient from './directives/composerInputRecipient';
import composerMessage from './directives/composerMessage';
import composerSelectFrom from './directives/composerSelectFrom';
import composerSubject from './directives/composerSubject';
import composerTime from './directives/composerTime';
import responsiveComposer from './directives/responsiveComposer';
import composerFromModel from './factories/composerFromModel';
import composerLoader from './factories/composerLoader';
import composerRender from './factories/composerRender';
import composerRequestModel from './factories/composerRequestModel';
import outsidersMap from './factories/outsidersMap';
import sendPreferences from './factories/sendPreferences';
import autoPinPrimaryKeys from './services/autoPinPrimaryKeys';
import mimeMessageBuilder from './services/mimeMessageBuilder';
import encryptMessage from './services/encryptMessage';
import encryptPackages from './services/encryptPackages';
import generateTopPackages from './services/generateTopPackages';
import attachSubPackages from './services/attachSubPackages';
import extractDataURI from './services/extractDataURI';
import attachPublicKey from './services/attachPublicKey';
import messageRequest from './services/messageRequest';
import onCurrentMessage from './services/onCurrentMessage';
import postMessage from './services/postMessage';
import sendMessage from './services/sendMessage';
import validateMessage from './services/validateMessage';
import expirationModal from './modals/expirationModal';
import editComposerContactGroupModal from './modals/editComposerContactGroupModal';
import composerContactGroupSelection from './factories/composerContactGroupSelection';

export default angular
    .module('proton.composer', ['proton.labels'])
    .factory('composerContactGroupSelection', composerContactGroupSelection)
    .factory('editComposerContactGroupModal', editComposerContactGroupModal)
    .controller('ComposeMessageController', ComposeMessageController)
    .directive('actionCompose', actionCompose)
    .directive('btnSendMessage', btnSendMessage)
    .directive('composer', composer)
    .directive('composerAskEmbedded', composerAskEmbedded)
    .directive('composerAttachments', composerAttachments)
    .directive('composerAttachmentsSize', composerAttachmentsSize)
    .directive('composerAttachmentsItem', composerAttachmentsItem)
    .directive('composerContainer', composerContainer)
    .directive('composerDropzone', composerDropzone)
    .directive('composerEncrypt', composerEncrypt)
    .directive('composerExpiration', composerExpiration)
    .directive('composerHeader', composerHeader)
    .directive('composerInputMeta', composerInputMeta)
    .directive('composerInputRecipient', composerInputRecipient)
    .directive('composerMessage', composerMessage)
    .directive('composerSelectFrom', composerSelectFrom)
    .directive('composerSubject', composerSubject)
    .directive('composerTime', composerTime)
    .directive('responsiveComposer', responsiveComposer)
    .factory('composerFromModel', composerFromModel)
    .factory('composerLoader', composerLoader)
    .factory('composerRender', composerRender)
    .factory('composerRequestModel', composerRequestModel)
    .factory('outsidersMap', outsidersMap)
    .factory('autoPinPrimaryKeys', autoPinPrimaryKeys)
    .factory('postMessage', postMessage)
    .factory('encryptMessage', encryptMessage)
    .factory('encryptPackages', encryptPackages)
    .factory('generateTopPackages', generateTopPackages)
    .factory('attachSubPackages', attachSubPackages)
    .factory('mimeMessageBuilder', mimeMessageBuilder)
    .factory('extractDataURI', extractDataURI)
    .factory('attachPublicKey', attachPublicKey)
    .factory('messageRequest', messageRequest)
    .factory('onCurrentMessage', onCurrentMessage)
    .factory('sendMessage', sendMessage)
    .factory('sendPreferences', sendPreferences)
    .factory('expirationModal', expirationModal)
    .factory('validateMessage', validateMessage).name;
