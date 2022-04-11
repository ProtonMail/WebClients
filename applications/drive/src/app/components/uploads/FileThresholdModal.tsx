import { c } from 'ttag';

import { BasicModal, Button, PrimaryButton } from '@proton/components';

type Props = {
    open?: boolean;
    onClose?: () => void;
    onSubmit: () => void;
    onCancel: () => void;
};

export const FileThresholdModal = ({ onSubmit, onCancel, onClose, open }: Props) => {
    const handleCancel = () => {
        onCancel();
        onClose?.();
    };

    return (
        <BasicModal
            title={c('Title').t`Performance might be affected`}
            isOpen={open === undefined ? true : open}
            onClose={handleCancel}
            footer={
                <>
                    <Button onClick={handleCancel}>{c('Action').t`Cancel`}</Button>
                    <PrimaryButton
                        onClick={() => {
                            onSubmit();
                            onClose?.();
                        }}
                    >
                        {c('Action').t`Upload anyway`}
                    </PrimaryButton>
                </>
            }
        >
            <p>{c('Info').t`Uploading hundreds of files at once may have a performance impact.`}</p>
        </BasicModal>
    );
};
