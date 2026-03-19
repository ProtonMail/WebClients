import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import type { ModalStateProps } from '@proton/components';
import Prompt from '@proton/components/components/prompt/Prompt';

export interface PasteCodeModalProps extends ModalStateProps {
    onPasteAsCode: () => void;
    onPasteNormal: () => void;
}

export const PasteCodeModal = ({ onPasteAsCode, onPasteNormal, ...modalProps }: PasteCodeModalProps) => {
    return (
        <Prompt
            {...modalProps}
            title={c('collider_2025: Title').t`Paste as code?`}
            buttons={[
                <Button key="code" className="w-full" onClick={onPasteAsCode} color="norm">
                    {c('collider_2025: Action').t`Paste as code`}
                </Button>,
                <Button key="normal" className="w-full" onClick={onPasteNormal} color="weak" shape="outline">
                    {c('collider_2025: Action').t`Paste as plaintext`}
                </Button>,
            ]}
        >
            <p className="text-left m-0">
                {c('collider_2025: Info')
                    .t`The content you pasted appears to be code. Would you like to paste it as a code block?`}
            </p>
        </Prompt>
    );
};
