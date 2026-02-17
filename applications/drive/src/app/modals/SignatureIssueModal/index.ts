import { useModalTwoStatic } from '@proton/components';

import { SignatureIssueModal } from './SignatureIssueModal';

export function useSignatureIssueModal() {
    const [signatureIssueModal, showSignatureIssueModal] = useModalTwoStatic(SignatureIssueModal);
    return { signatureIssueModal, showSignatureIssueModal };
}
