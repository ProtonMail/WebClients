import ReactDOM from 'react-dom';

import '@proton/polyfill';

import App from './App';

ReactDOM.render(<App />, document.querySelector('.app-root'));
export { useCreateFileModal } from './components/CreateFileModal';
export { useCreateFolderModal } from './components/CreateFolderModal';
export { useDetailsModal } from './components/DetailsModal';
export { useFilesDetailsModal } from './components/FilesDetailsModal';
export { useFileSharingModal } from './components/SelectLinkToShareModal/SelectLinkToShareModal';
export { useLinkSharingModal } from './components/ShareLinkModal/ShareLinkModal';
export { useMoveToFolderModal } from './components/MoveToFolderModal/MoveToFolderModal';
export { useRenameModal } from './components/RenameModal';
