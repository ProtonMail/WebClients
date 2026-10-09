import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { ModalTwo, ModalTwoContent, ModalTwoFooter, ModalTwoHeader } from '@proton/components';
import type { ModalStateProps } from '@proton/components/components/modalTwo/useModalState';

import { useIsGuest } from '../../providers/IsGuestProvider';
import type { DictationLanguage } from '../../util/dictationLanguages';
import { DictationLanguageSelect } from './DictationLanguageSelect';

interface Props extends ModalStateProps {
    initialLanguage: DictationLanguage;
    onConfirm: (language: DictationLanguage) => void;
}

export const DictationLanguageModal = ({ initialLanguage, onConfirm, ...modalProps }: Props) => {
    const isGuest = useIsGuest();
    const [language, setLanguage] = useState<DictationLanguage>(initialLanguage);

    return (
        <ModalTwo {...modalProps} size="small">
            <ModalTwoHeader title={c('collider_2025: Title').t`Choose your dictation language`} />
            <ModalTwoContent>
                <p className="mt-0">
                    {c('collider_2025: Info')
                        .t`Telling us which language you speak helps dictation transcribe your voice accurately.`}
                </p>
                <DictationLanguageSelect id="dictation-language-modal-select" value={language} onChange={setLanguage} />
                <p className="mb-0 mt-4 text-sm color-weak">
                    {isGuest
                        ? c('collider_2025: Info')
                              .t`Sign in to change this later in Settings → General → Dictation language.`
                        : c('collider_2025: Info')
                              .t`You can change this at any time in Settings → General → Dictation language.`}
                </p>
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button onClick={modalProps.onClose}>{c('collider_2025: Action').t`Cancel`}</Button>
                <Button
                    color="norm"
                    onClick={() => {
                        onConfirm(language);
                        modalProps.onClose?.();
                    }}
                >
                    {c('collider_2025: Action').t`Continue`}
                </Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};
