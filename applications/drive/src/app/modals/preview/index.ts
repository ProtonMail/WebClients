/**
 * Drive Preview compontent for the drive node.
 *
 * It loads the node data using the Drive SDK and connects it to
 * the FilePreview UI component.
 *
 * The preview can be used in two ways: modal or directly. If there is a doubt
 * about which one to use, use the modal.
 *
 * The modal shows the preview over the whole screen and keeps the current
 * application state as is. This is useful when user closes the preview,
 * it should go back to the previous state (including the selection, scroll
 * position, etc.).
 *
 * Even if the modal is used, the modal automatically changes the cannonical
 * Drive URL pointing to the given node. When user refreshes the tab, it will
 * load the preview of the node again.
 *
 * The direct preview load is the only place where the direct preview component
 * should be used as it skips the URL change and handles the navigation after
 * user closes the preview. By default the user is then redirected to the parent
 * folder.
 */

export { Preview } from './Preview';
export { PartialPreview } from './PartialPreview';
export { useDrivePreviewModal } from './useDrivePreviewModal';
export { ContentPreviewMethod } from './content';
export { usePhotosPreviewModal } from './usePhotosPreviewModal';
export { useDrivePublicPreviewModal } from './useDrivePublicPreviewModal';
