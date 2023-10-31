import * as React from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { Icon } from '@proton/components';

interface Props {
    onClick: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
}

const BackButton = ({ onClick }: Props) => {
    return (
        <Button
            className="sm:shadow-lifted shadow-color-primary"
            icon
            shape="outline"
            onClick={onClick}
            title={c('Action').t`Back`}
        >
            <Icon name="arrow-left" className="on-rtl-mirror" alt={c('Action').t`Back`} />
        </Button>
    );
};

export default BackButton;
