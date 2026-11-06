import * as React from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { IcArrowLeft } from '@proton/icons/icons/IcArrowLeft';

interface Props {
    onClick: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
}

const BackButton = ({ onClick }: Props) => {
    return (
        <Button
            className="sm:shadow-lifted shadow-color-primary ui-standard"
            icon
            shape="outline"
            onClick={onClick}
            title={c('Action').t`Back`}
        >
            <IcArrowLeft className="rtl:mirror" alt={c('Action').t`Back`} />
        </Button>
    );
};

export default BackButton;
