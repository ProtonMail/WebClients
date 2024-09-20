import { c } from 'ttag';

import { Button } from '@proton/atoms';
import type { ModalStateProps } from '@proton/components/components/modalTwo/useModalState';
import Prompt from '@proton/components/components/prompt/Prompt';
import useLoading from '@proton/hooks/useLoading';

interface Props {
    title: string;
    buttonTitle: string;
    children: React.ReactNode;
    onConfirm: () => Promise<void>;
}

const GroupItemActionPrompt = ({
    title,
    buttonTitle,
    children,
    onClose,
    onConfirm,
    open,
    ...modalProps
}: Props & ModalStateProps) => {
    const [loading, withLoading] = useLoading();

    return (
        <Prompt
            open={open}
            onClose={onClose}
            title={title}
            buttons={[
                <Button
                    color="danger"
                    onClick={() => {
                        withLoading(onConfirm().then(() => onClose()));
                    }}
                    loading={loading}
                >
                    {buttonTitle}
                </Button>,
                <Button onClick={onClose}>{c('Action').t`Cancel`}</Button>,
            ]}
            {...modalProps}
        >
            <p className="m-0">{children}</p>
        </Prompt>
    );
};

export default GroupItemActionPrompt;
