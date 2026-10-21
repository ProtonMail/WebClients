import { useModalTwoStatic } from '@proton/components/components/modalTwo/useModalTwo';

import { SignatureIssueModal } from './SignatureIssueModal';

export function useSignatureIssueModal() {
    const [signatureIssueModal, showSignatureIssueModal] = useModalTwoStatic(SignatureIssueModal);
    return { signatureIssueModal, showSignatureIssueModal };
}
