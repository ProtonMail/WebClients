import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import Prompt from '@proton/components/components/prompt/Prompt';

interface Props {
    onWipe: () => Promise<void>;
    className?: string;
    loading?: boolean;
}

const WipeLogsButton = ({ onWipe, className, loading }: Props) => {
    const [modalProps, setModal, renderModal] = useModalState();

    return (
        <>
            {renderModal && (
                <Prompt
                    {...modalProps}
                    onClose={modalProps.onClose}
                    title={c('Action').t`Delete logs`}
                    buttons={[
                        <Button color="danger" onClick={onWipe}>
                            {c('Action').t`Delete logs`}
                        </Button>,
                        <Button onClick={modalProps.onClose}>{c('Action').t`Cancel`}</Button>,
                    ]}
                >
                    {c('Info').t`Are you sure you want to permanently delete all your logs?`}
                </Prompt>
            )}
            <Button
                shape="outline"
                className={className}
                loading={loading}
                onClick={() => {
                    setModal(true);
                }}
            >
                {c('Action').t`Wipe`}
            </Button>
        </>
    );
};

export default WipeLogsButton;
