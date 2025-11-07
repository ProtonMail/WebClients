import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import type { ModalProps } from '@proton/components';
import { ModalTwo, ModalTwoContent, ModalTwoFooter } from '@proton/components';
import { DOCS_APP_NAME } from '@proton/shared/lib/constants';
import sharingOnboardingWelcome from '@proton/styles/assets/img/onboarding/drive-docs-suggestion-mode.png';

import { useActiveShare } from '../../hooks/drive/useActiveShare';
import { useDocumentActions } from '../../store/_documents';
import { Actions, countActionWithTelemetry } from '../../utils/telemetry';

export const DocsSuggestionsOnboardingModal = ({ onClose, ...props }: ModalProps) => {
    const { activeFolder } = useActiveShare();
    const { createDocument } = useDocumentActions();

    return (
        <ModalTwo {...props} size="small">
            <ModalTwoContent>
                <section className="flex justify-center px-6">
                    <img className="my-4" src={sharingOnboardingWelcome} alt={DOCS_APP_NAME} />
                    <h1 className="text-4xl text-bold text-center">{c('Docs Info').t`Suggestion mode is here`}</h1>
                    <p className="text-center color-weak mt-4 mb-1">{c('Docs Info')
                        .t`Collaborating just got easier. Now anyone can suggest edits without changing the document.`}</p>
                </section>
            </ModalTwoContent>
            <ModalTwoFooter className="flex gap-4 px-6">
                <Button
                    className="mb-0"
                    size="large"
                    color="norm"
                    fullWidth
                    onClick={() => {
                        void createDocument({
                            type: 'doc',
                            shareId: activeFolder.shareId,
                            parentLinkId: activeFolder.linkId,
                        });
                        onClose?.();
                    }}
                >
                    {c('Onboarding Action').t`Create a document`}
                </Button>
                <Button
                    size="large"
                    color="norm"
                    shape="ghost"
                    fullWidth
                    onClick={() => {
                        countActionWithTelemetry(Actions.DismissDocsSuggestionsOnboardingModal);
                        onClose?.();
                    }}
                    data-testid="drive-onboarding-dismiss"
                >
                    {c('Onboarding Action').t`Maybe Later`}
                </Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};
