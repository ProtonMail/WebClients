import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { ModalProps, Prompt } from '@proton/components/components';

const StorageRewardModal = (props: ModalProps) => {
    return (
        <Prompt
            {...props}
            title={c('Get started checklist instructions').t`You've unlocked 1 GB`}
            buttons={[<Button onClick={() => props?.onClose?.()}>{c('Action').t`Got it`}</Button>]}
        >
            <p className="m-0">
                {c('Get started checklist instructions')
                    .t`Bravo for making your email even more secure, convenient, and relevant! We've upped your free storage to a total of 1 GB.`}
            </p>
        </Prompt>
    );
};

export default StorageRewardModal;
