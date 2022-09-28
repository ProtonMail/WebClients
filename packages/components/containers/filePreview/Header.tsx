import { ReactNode, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';

import { useLoading } from '../../';
import { FileIcon, FileNameDisplay, Icon } from '../../components';

const SHARED_STATUS_TO_COLOR = {
    '': undefined,
    shared: 'color-info',
    inactive: 'color-weak',
};

export type SharedStatus = '' | 'shared' | 'inactive';

interface Props {
    name?: string;
    mimeType?: string;
    sharedStatus?: SharedStatus;
    signatureStatus?: ReactNode;
    isDirty?: boolean;
    onClose?: () => void;
    onDownload?: () => void;
    onSave?: () => Promise<void>;
    onDetail?: () => void;
    onShare?: () => void;
    children?: ReactNode;
}

const Header = ({
    mimeType,
    name,
    sharedStatus,
    signatureStatus,
    isDirty,
    onClose,
    onDownload,
    onSave,
    onDetail,
    onShare,
    children,
}: Props) => {
    const [isSaving, withSaving] = useLoading();
    const [saveError, setSaveError] = useState();

    const handleSave = () => {
        if (!onSave) {
            return;
        }
        withSaving(
            onSave().catch((err) => {
                setSaveError(err?.message || err?.toString?.());
            })
        );
    };

    return (
        <div className="flex flex-justify-space-between flex-align-items-center p2 relative">
            <div className="file-preview-filename flex flex-align-items-center flex-nowrap">
                {mimeType && <FileIcon mimeType={mimeType} className="mr0-5" />}
                <FileNameDisplay text={name} />
                {signatureStatus}
            </div>
            {children}
            <div className="flex flex-align-items-center">
                {onDownload && (
                    <Button
                        icon
                        shape="ghost"
                        title={c('Action').t`Download`}
                        onClick={onDownload}
                        className="ml0-5"
                        data-testid="preview:button:download"
                    >
                        <Icon name="arrow-down-line" size={20} alt={c('Action').t`Download`} />
                    </Button>
                )}
                {onSave && (
                    <Button
                        icon
                        shape="ghost"
                        title={
                            saveError
                                ? c('Action').t`Try to save again. Saving failed due to: ${saveError}`
                                : c('Action').t`Save`
                        }
                        onClick={handleSave}
                        className="ml0-5"
                        data-testid="preview:button:save"
                        loading={isSaving}
                        disabled={!isDirty}
                    >
                        <Icon
                            name={saveError ? 'exclamation-circle-filled' : 'arrow-up-line'}
                            size={20}
                            alt={c('Action').t`Save`}
                        />
                    </Button>
                )}
                {onDetail && (
                    <Button
                        icon
                        shape="ghost"
                        title={c('Action').t`Details`}
                        onClick={onDetail}
                        className="ml0-5 no-mobile"
                        data-testid="preview:button:details"
                    >
                        <Icon name="info-circle" size={20} alt={c('Action').t`Details`} />
                    </Button>
                )}
                {onShare && (
                    <Button
                        icon
                        shape="ghost"
                        title={sharedStatus === '' ? c('Action').t`Share via link` : c('Action').t`Sharing options`}
                        onClick={onShare}
                        className="ml0-5 no-mobile"
                        data-testid="preview:button:share"
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
                    <Button
                        icon
                        shape="ghost"
                        title={c('Action').t`Close`}
                        onClick={onClose}
                        className="ml0-5"
                        data-testid="preview:button:close"
                    >
                        <Icon name="cross" size={20} alt={c('Action').t`Close`} />
                    </Button>
                )}
            </div>
        </div>
    );
};

export default Header;
