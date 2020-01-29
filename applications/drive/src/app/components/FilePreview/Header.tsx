import React from 'react';
import { Icon } from 'react-components';
import { c } from 'ttag';

interface Props {
    name?: string;
    onClose?: () => void;
    onSave?: () => void;
    children?: React.ReactNode;
}

const Header = ({ name, onClose, onSave, children }: Props) => {
    return (
        <div className="flex flex-spacebetween flex-items-center p2 relative">
            <span title={name} className="pd-file-preview-filename">
                {name}
            </span>
            {children}
            <div className="flex flex-items-center">
                {onSave && (
                    <button title={c('Action').t`Download`} onClick={onSave} className="color-global-light ml1-5">
                        <Icon className="fill-currentColor" name="download" size={20} />
                    </button>
                )}
                {onClose && (
                    <button title={c('Action').t`Close`} onClick={onClose} className="color-global-light ml1-5">
                        <Icon className="fill-currentColor" name="off" size={20} />
                    </button>
                )}
            </div>
        </div>
    );
};

export default Header;
