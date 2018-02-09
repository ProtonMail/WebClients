import btnDownloadAttachments from './directives/btnDownloadAttachments';
import iconAttachment from './directives/iconAttachment';
import listAttachments from './directives/listAttachments';
import eventsAttachments from './directives/eventsAttachments';
import attachmentFileFormat from './factories/attachmentFileFormat';
import attachmentModel from './factories/attachmentModel';
import embeddedStore from './factories/embeddedStore';
import AttachmentLoader from './services/AttachmentLoader';
import AttachmentEvent from './services/AttachmentEvent';
import attachmentApi from './services/attachmentApi';
import attachmentDownloader from './services/attachmentDownloader';
import embedded from './services/embedded';
import embeddedFinder from './services/embeddedFinder';
import embeddedParser from './services/embeddedParser';
import embeddedUtils from './services/embeddedUtils';

export default angular
    .module('proton.attachments', ['proton.authentication', 'proton.utils'])
    .directive('btnDownloadAttachments', btnDownloadAttachments)
    .directive('iconAttachment', iconAttachment)
    .directive('eventsAttachments', eventsAttachments)
    .directive('listAttachments', listAttachments)
    .factory('attachmentFileFormat', attachmentFileFormat)
    .factory('attachmentModel', attachmentModel)
    .factory('embeddedStore', embeddedStore)
    .factory('AttachmentLoader', AttachmentLoader)
    .factory('AttachmentEvent', AttachmentEvent)
    .factory('attachmentApi', attachmentApi)
    .factory('attachmentDownloader', attachmentDownloader)
    .factory('embedded', embedded)
    .factory('embeddedFinder', embeddedFinder)
    .factory('embeddedParser', embeddedParser)
    .factory('embeddedUtils', embeddedUtils).name;
