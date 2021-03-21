import React from 'react';
import { c } from 'ttag';
import { Button, Icon } from 'react-components';

interface Props {
    onClick: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
}

const BackButton = ({ onClick }: Props) => {
    return (
        <Button icon shape="ghost" onClick={onClick} title={c('Action').t`Back`}>
            <Icon name="arrow-left" alt={c('Action').t`Back`} />
        </Button>
    );
};

export default BackButton;
