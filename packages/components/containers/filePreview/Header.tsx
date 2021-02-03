import React from 'react';
import { c } from 'ttag';
import { Icon, FileIcon } from '../../components';

interface Props {
    name?: string;
    mimeType?: string;
    onClose?: () => void;
    onSave?: () => void;
    children?: React.ReactNode;
}

const Header = ({ mimeType, name, onClose, onSave, children }: Props) => {
    return (
        <div className="flex flex-justify-space-between flex-align-items-center p2 relative">
            <div title={name} className="file-preview-filename flex flex-align-items-center flex-nowrap">
                {mimeType && <FileIcon mimeType={mimeType} />}
                <span className="text-ellipsis">
                    <span className="text-pre">{name}</span>
                </span>
            </div>
            {children}
            <div className="flex flex-align-items-center">
                {onSave && (
                    <button
                        type="button"
                        title={c('Action').t`Download`}
                        onClick={onSave}
                        className="color-global-light ml1-5"
                    >
                        <Icon name="download" size={20} />
                    </button>
                )}
                {onClose && (
                    <button
                        type="button"
                        title={c('Action').t`Close`}
                        onClick={onClose}
                        className="color-global-light ml1-5"
                    >
                        <Icon name="off" size={20} />
                    </button>
                )}
            </div>
        </div>
    );
};

export default Header;
