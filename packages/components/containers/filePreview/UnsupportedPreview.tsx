import React from 'react';
import { c } from 'ttag';
import { PrimaryButton } from '../../components/button';

interface Props {
    onSave?: () => void;
}

const UnsupportedPreview = ({ onSave }: Props) => {
    return (
        <div className="pd-file-preview-container">
            <div className="centered-absolute aligncenter">
                <div className="mb1">{c('Info').t`Preview for this file is unsupported`}</div>
                {onSave && <PrimaryButton onClick={onSave}>{c('Action').t`Save file`}</PrimaryButton>}
            </div>
        </div>
    );
};

export default UnsupportedPreview;
