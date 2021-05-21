import React from 'react';
import { c } from 'ttag';
import { Icon, FileIcon, FileNameDisplay, Button } from '../../components';

const SHARED_STATUS_TO_COLOR = {
    '': undefined,
    shared: 'color-info',
    expired: 'color-weak',
};

export type SharedStatus = '' | 'shared' | 'expired';

interface Props {
    name?: string;
    mimeType?: string;
    sharedStatus?: SharedStatus;
    onClose?: () => void;
    onSave?: () => void;
    onDetail?: () => void;
    onShare?: () => void;
    children?: React.ReactNode;
}

const Header = ({ mimeType, name, sharedStatus, onClose, onSave, onDetail, onShare, children }: Props) => {
    return (
        <div className="flex flex-justify-space-between flex-align-items-center p2 relative">
            <div className="file-preview-filename flex flex-align-items-center flex-nowrap">
                {mimeType && <FileIcon mimeType={mimeType} />}
                <FileNameDisplay text={name} />
            </div>
            {children}
            <div className="flex flex-align-items-center">
                {onSave && (
                    <Button icon shape="ghost" title={c('Action').t`Download`} onClick={onSave} className="ml0-5">
                        <Icon name="download" size={20} alt={c('Action').t`Download`} />
                    </Button>
                )}
                {onDetail && (
                    <Button
                        icon
                        shape="ghost"
                        title={c('Action').t`Details`}
                        onClick={onDetail}
                        className="ml0-5 no-mobile"
                    >
                        <Icon name="info" size={20} alt={c('Action').t`Details`} />
                    </Button>
                )}
                {onShare && (
                    <Button
                        icon
                        shape="ghost"
                        title={sharedStatus === '' ? c('Action').t`Share via link` : c('Action').t`Sharing options`}
                        onClick={onShare}
                        className="ml0-5 no-mobile"
                    >
                        <Icon
                            name="link"
                            size={20}
                            alt={sharedStatus === '' ? c('Action').t`Share via link` : c('Action').t`Sharing options`}
                            className={SHARED_STATUS_TO_COLOR[sharedStatus || '']}
                        />
                    </Button>
                )}
                {onClose && (
                    <Button icon shape="ghost" title={c('Action').t`Close`} onClick={onClose} className="ml0-5">
                        <Icon name="off" size={20} alt={c('Action').t`Close`} />
                    </Button>
                )}
            </div>
        </div>
    );
};

export default Header;
