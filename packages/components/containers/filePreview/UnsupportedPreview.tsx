import React from 'react';
import { c } from 'ttag';
import unsupportedPreviewSvg from 'design-system/assets/img/shared/preview-unsupported.svg';
import corruptedPreviewSvg from 'design-system/assets/img/shared/preview-corrupted.svg';
import { PrimaryButton } from '../../components';

interface Props {
    type?: 'file' | 'image';
    onSave?: () => void;
}

const UnsupportedPreview = ({ onSave, type = 'file' }: Props) => {
    return (
        <div className="centered-absolute aligncenter">
            <img
                className="mb1"
                src={type === 'file' ? unsupportedPreviewSvg : corruptedPreviewSvg}
                alt={c('Info').t`Unsupported file`}
            />
            <h2 className="p0-25 bold">{c('Info').t`No preview available`}</h2>
            {onSave && (
                <PrimaryButton className="pm-button--large w150p bold" onClick={onSave}>{c('Action')
                    .t`Download`}</PrimaryButton>
            )}
        </div>
    );
};

export default UnsupportedPreview;
