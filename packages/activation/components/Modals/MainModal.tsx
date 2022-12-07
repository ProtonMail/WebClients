import { ImportType } from '@proton/activation/interface';
import ContactImportModal from '@proton/components/containers/contacts/import/ContactImportModal';

import { selectDraftModal } from '../../logic/draft/draft.selector';
import {
    readImapInstructions,
    resetImapDraft,
    selectImapProductToImport,
} from '../../logic/draft/imapDraft/imapDraft.actions';
import { resetOauthDraft } from '../../logic/draft/oauthDraft/oauthDraft.actions';
import { useEasySwitchDispatch, useEasySwitchSelector } from '../../logic/store';
import CalendarModal from './Imap/CalendarModal/CalendarModal';
import ImapMailModal from './Imap/ImapMailModal/ImapMailModal';
import ImapProductsModal from './Imap/ImapProductsModal/ImapProductsModal';
import InstructionsModal from './Imap/InstructionsModal/InstructionsModal';
import OauthModal from './Oauth/OauthModal';

import './MainModal.scss';

const MainModal = () => {
    const dispatch = useEasySwitchDispatch();
    const modal = useEasySwitchSelector(selectDraftModal);

    if (modal === 'select-product') {
        return (
            <ImapProductsModal
                onClick={(selectedProduct: ImportType) => {
                    dispatch(selectImapProductToImport({ product: selectedProduct }));
                }}
                onClose={() => dispatch(resetImapDraft())}
            />
        );
    }

    if (modal === 'read-instructions') {
        return (
            <InstructionsModal
                onClose={() => dispatch(resetImapDraft())}
                onSubmit={() => {
                    dispatch(readImapInstructions());
                }}
            />
        );
    }

    if (modal === 'import-Mail') {
        return <ImapMailModal onClose={() => dispatch(resetImapDraft())} />;
    }

    if (modal === 'import-Calendar') {
        return <CalendarModal onClose={() => dispatch(resetImapDraft())} />;
    }

    if (modal === 'import-Contacts') {
        return <ContactImportModal open onClose={() => dispatch(resetImapDraft())} />;
    }

    if (modal === 'oauth') {
        return <OauthModal onClose={() => dispatch(resetOauthDraft())} />;
    }

    return null;
};

export default MainModal;
