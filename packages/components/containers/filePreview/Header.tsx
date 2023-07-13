import { ReactNode, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { useLoading } from '@proton/hooks';

import { TimeIntl } from '../../';
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
    onRestore?: () => void; // revision's specific
    date?: Date | string | number;
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
    onRestore,
    date,
    children,
}: Props) => {
    const [isSaving, withSaving] = useLoading();
    const [saveError, setSaveError] = useState();

    const handleSave = () => {
        if (!onSave) {
            return;
        }
        void withSaving(
            onSave()
                .then(() => {
                    setSaveError(undefined);
                })
                .catch((err) => {
                    setSaveError(err?.message || err?.toString?.());
                })
        );
    };

    return (
        <div className="flex flex-justify-space-between flex-align-items-center p-7 relative">
            <div
                className="file-preview-filename flex flex-align-items-center flex-nowrap"
                data-testid="preview:file-name"
            >
                {mimeType && <FileIcon mimeType={mimeType} className="mr-2" />}
                <FileNameDisplay text={name} data-testid="file-preview:file-name" />
                {signatureStatus}
            </div>
            {date && (
                <TimeIntl
                    className="flex-item-fluid text-ellipsis ml-5"
                    data-testid="file-preview:date"
                    options={{
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: 'numeric',
                    }}
                >
                    {date}
                </TimeIntl>
            )}
            {children}
            <div className="flex flex-align-items-center mt-2 ml-auto sm:m-0">
                {onRestore && (
                    <Button
                        title={c('Action').t`Restore`}
                        onClick={onRestore}
                        shape="solid"
                        className="mx-2 lg:mr-11"
                        color="norm"
                        data-testid="file-preview:actions:restore"
                    >
                        {c('Info').t`Restore`}
                    </Button>
                )}
                {onDownload && (
                    <Button
                        icon
                        shape="ghost"
                        title={c('Action').t`Download`}
                        onClick={onDownload}
                        className="ml-2"
                        data-testid="file-preview:actions:download"
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
                        className="ml-2"
                        data-testid="file-preview:actions:save"
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
                        className="ml-2 no-mobile"
                        data-testid="file-preview:actions:details"
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
                        className="ml-2 no-mobile"
                        data-testid="file-preview:actions:share"
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
                        className="ml-2"
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
