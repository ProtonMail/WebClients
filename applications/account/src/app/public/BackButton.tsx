import * as React from 'react';
import { c } from 'ttag';
import { Button, Icon } from '@proton/components';

interface Props {
    onClick: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
}

const BackButton = ({ onClick }: Props) => {
    return (
        <Button
            className="shadow-lifted on-tiny-mobile-no-box-shadow"
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
