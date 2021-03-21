import React from 'react';

interface Props {
    children: React.ReactNode;
    mode?: 'button' | 'text' | 'secondary';
}

const ButtonSpacer = ({ children, mode = 'button' }: Props) => {
    return (
        <div className={mode === 'text' ? 'p1 text-center mt1' : mode === 'secondary' ? 'mt0-25' : 'mt1'}>
            {children}
        </div>
    );
};

export default ButtonSpacer;
