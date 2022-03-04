import { BasicModal, Button } from '@proton/components';
import { useState } from 'react';
import { c } from 'ttag';

type Props = {
    onSubmit: () => void;
    onCancel: () => void;
};

export const FileThresholdModal = ({ onSubmit, onCancel }: Props) => {
    const [open, setOpen] = useState(true);
    const handleCancel = () => {
        setOpen(false);
        onCancel();
    };
    return (
        <BasicModal
            title={c('Title').t`Performance might be affected`}
            isOpen={open}
            onClose={handleCancel}
            footer={
                <>
                    <Button onClick={handleCancel}>{c('Action').t`Cancel`}</Button>
                    <Button
                        color="norm"
                        onClick={() => {
                            onSubmit();
                            setOpen(false);
                        }}
                    >
                        {c('Action').t`Upload anyway`}
                    </Button>
                </>
            }
        >
            <p>{c('Info').t`Uploading hundreds of files at once may have a performance impact.`}</p>
        </BasicModal>
    );
};
