import { ImportType } from '@proton/activation/interface';
import { selectDraftModal } from '@proton/activation/logic/draft/draft.selector';
import {
    readImapInstructions,
    resetImapDraft,
    selectImapProduct,
} from '@proton/activation/logic/draft/imapDraft/imapDraft.actions';
import { resetOauthDraft } from '@proton/activation/logic/draft/oauthDraft/oauthDraft.actions';
import { useEasySwitchDispatch, useEasySwitchSelector } from '@proton/activation/logic/store';
import ContactImportModal from '@proton/components/containers/contacts/import/ContactImportModal';

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
                    dispatch(selectImapProduct({ product: selectedProduct }));
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
        return <ImapMailModal />;
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
