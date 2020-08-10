import React from 'react';
import { c } from 'ttag';
import brokenImageSvg from 'design-system/assets/img/shared/broken-image.svg';
import brokenFileSvg from 'design-system/assets/img/shared/broken-file.svg';
import { PrimaryButton } from '../../components/button';

interface Props {
    type?: 'file' | 'image';
    onSave?: () => void;
}

const UnsupportedPreview = ({ onSave, type = 'file' }: Props) => {
    const imageSrc = type === 'file' ? brokenFileSvg : brokenImageSvg;

    return (
        <div className="centered-absolute aligncenter">
            <img className="mb0-5" src={imageSrc} alt={c('Info').t`Unsupported file`} />
            <div className="p0-25">{c('Info').t`No preview available.`}</div>
            {onSave && <PrimaryButton onClick={onSave} className="mt2">{c('Action').t`Download`}</PrimaryButton>}
        </div>
    );
};

export default UnsupportedPreview;
