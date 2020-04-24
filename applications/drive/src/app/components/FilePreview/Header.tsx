import React from 'react';
import { Icon } from 'react-components';
import { c } from 'ttag';
import FileIcon from '../FileIcon';

interface Props {
    name?: string;
    mimeType?: string;
    onClose?: () => void;
    onSave?: () => void;
    children?: React.ReactNode;
}

const Header = ({ mimeType, name, onClose, onSave, children }: Props) => {
    return (
        <div className="flex flex-spacebetween flex-items-center p2 relative">
            <div title={name} className="pd-file-preview-filename flex flex-items-center flex-nowrap">
                {mimeType && <FileIcon mimeType={mimeType} />}
                <span className="ellipsis">{name}</span>
            </div>
            {children}
            <div className="flex flex-items-center">
                {onSave && (
                    <button title={c('Action').t`Download`} onClick={onSave} className="color-global-light ml1-5">
                        <Icon name="download" size={20} />
                    </button>
                )}
                {onClose && (
                    <button title={c('Action').t`Close`} onClick={onClose} className="color-global-light ml1-5">
                        <Icon name="off" size={20} />
                    </button>
                )}
            </div>
        </div>
    );
};

export default Header;
