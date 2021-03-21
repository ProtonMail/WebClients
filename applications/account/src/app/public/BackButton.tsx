import React from 'react';
import { c } from 'ttag';
import { Button } from 'react-components';

interface Props {
    onClick: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
}

const BackButton = ({ onClick }: Props) => {
    return (
        <Button
            type="button"
            color="weak"
            shape="ghost"
            onClick={onClick}
            title={c('Action').t`Back`}
            icon="arrow-left"
        >
            <span className="sr-only">{c('Action').t`Back`}</span>
        </Button>
    );
};

export default BackButton;
