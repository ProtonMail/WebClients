import eventsAttachments from './directives/eventsAttachments';
import attachmentFileFormat from './factories/attachmentFileFormat';
import attachmentModel from './factories/attachmentModel';
import embeddedStore from './factories/embeddedStore';
import attachmentElement from './directives/attachmentElement';
import btnDownloadAttachments from './directives/btnDownloadAttachments';
import iconAttachment from './directives/iconAttachment';
import listAttachments from './directives/listAttachments';
import AttachmentLoader from './services/AttachmentLoader';
import SignatureVerifier from './services/SignatureVerifier';
import AttachmentEvent from './services/AttachmentEvent';
import attachmentApi from './services/attachmentApi';
import attachmentConverter from './services/attachmentConverter';
import attachmentDownloader from './services/attachmentDownloader';
import embedded from './services/embedded';
import embeddedFinder from './services/embeddedFinder';
import embeddedParser from './services/embeddedParser';
import embeddedUtils from './services/embeddedUtils';
import pgpMimeAttachments from './services/pgpMimeAttachments';
import invalidSignature from './services/invalidSignature';
import attendeeItem from './directives/attendeeItem';

export default angular
    .module('proton.attachments', ['proton.authentication', 'proton.utils'])
    .directive('attendeeItem', attendeeItem)
    .directive('btnDownloadAttachments', btnDownloadAttachments)
    .directive('iconAttachment', iconAttachment)
    .directive('eventsAttachments', eventsAttachments)
    .directive('listAttachments', listAttachments)
    .factory('attachmentFileFormat', attachmentFileFormat)
    .factory('attachmentModel', attachmentModel)
    .factory('embeddedStore', embeddedStore)
    .directive('attachmentElement', attachmentElement)
    .directive('btnDownloadAttachments', btnDownloadAttachments)
    .factory('AttachmentLoader', AttachmentLoader)
    .factory('SignatureVerifier', SignatureVerifier)
    .factory('AttachmentEvent', AttachmentEvent)
    .factory('attachmentApi', attachmentApi)
    .factory('attachmentConverter', attachmentConverter)
    .factory('attachmentDownloader', attachmentDownloader)
    .factory('pgpMimeAttachments', pgpMimeAttachments)
    .factory('embedded', embedded)
    .factory('embeddedFinder', embeddedFinder)
    .factory('embeddedParser', embeddedParser)
    .factory('embeddedUtils', embeddedUtils)
    .factory('invalidSignature', invalidSignature).name;
