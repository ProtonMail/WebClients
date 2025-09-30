import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { type ModalProps, Prompt, useModalState } from '@proton/components';

const B2COnboardingPromptPrivate = (props: ModalProps) => {
    return (
        <Prompt
            {...props}
            buttons={[<Button onClick={() => props.onClose?.()}>{c('Action').t`Got it`}</Button>]}
            title={c('Title').t`Built for privacy`}
        >
            <p>{c('Info')
                .t`Categories work like spam filters. We only look for patterns in unencrypted header and technical data. We do not read email content, share your data, or infringe on your privacy.`}</p>
        </Prompt>
    );
};

export const ButtonOnboardingPrivate = () => {
    const [modal, setModal, renderModal] = useModalState();

    return (
        <>
            <div className="w-full text-center">
                <Button
                    shape="underline"
                    size="small"
                    className="mx-auto color-weak p-0"
                    onClick={() => setModal(true)}
                >{c('Action').t`Is this private?`}</Button>
            </div>
            {renderModal && <B2COnboardingPromptPrivate {...modal} />}
        </>
    );
};
