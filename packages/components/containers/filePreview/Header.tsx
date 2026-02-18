import type { ReactNode } from 'react';
import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import FileIcon from '@proton/components/components/fileIcon/FileIcon';
import FileNameDisplay from '@proton/components/components/fileNameDisplay/FileNameDisplay';
import Icon from '@proton/components/components/icon/Icon';
import MimeIcon from '@proton/components/components/icon/MimeIcon';
import TimeIntl from '@proton/components/components/time/TimeIntl';
import useActiveBreakpoint from '@proton/components/hooks/useActiveBreakpoint';
import { useLoading } from '@proton/hooks';
import { IcArrowDownLine } from '@proton/icons/icons/IcArrowDownLine';
import { IcCross } from '@proton/icons/icons/IcCross';
import { IcInfoCircle } from '@proton/icons/icons/IcInfoCircle';
import { IcWindowImage } from '@proton/icons/icons/IcWindowImage';
import { getOpenInDocsMimeIconName, getOpenInDocsString } from '@proton/shared/lib/drive/translations';
import { isMobile } from '@proton/shared/lib/helpers/browser';
import { isElectronMail, isElectronOnMac } from '@proton/shared/lib/helpers/desktop';
import { mimeTypeToOpenInDocsType } from '@proton/shared/lib/helpers/mimetype';
import useFlag from '@proton/unleash/useFlag';
import clsx from '@proton/utils/clsx';

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
    onDetails?: () => void;
    onShare?: () => void;
    onSelectCover?: () => void; // photos inside album only
    onFavorite?: () => void; // photos only
    isFavorite?: boolean;
    onRestore?: () => void; // revision's specific
    onOpenInDocs?: () => void;
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
    onDetails,
    onShare,
    onRestore,
    onOpenInDocs,
    onSelectCover,
    onFavorite,
    isFavorite,
    date,
    children,
}: Props) => {
    const [isSaving, withSaving] = useLoading();
    const [saveError, setSaveError] = useState();
    const { viewportWidth } = useActiveBreakpoint();
    const isMobileHeaderPreview = viewportWidth['<=small'] && isMobile();
    const isLargeViewport = viewportWidth['>=large'];

    let headerSpacing = 'p-7';

    if (isElectronMail && isElectronOnMac) {
        headerSpacing = 'py-2 pr-2 ml-16 pl-6';
    } else if (isMobileHeaderPreview) {
        headerSpacing = 'py-7 px-2';
    }

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

    const isODSImportEnabled = useFlag('SheetsODSImportEnabled');
    const openInDocsType = mimeTypeToOpenInDocsType(mimeType, isODSImportEnabled);

    return (
        <div className={clsx('file-preview-header flex justify-space-between items-center relative', headerSpacing)}>
            <div className="flex-1">
                <div className="file-preview-filename flex items-center flex-nowrap" data-testid="preview:file-name">
                    {mimeType && <FileIcon mimeType={mimeType} className="mr-2" />}
                    <FileNameDisplay text={name} className="user-select" testId="file-preview:file-name" />
                    {signatureStatus}
                </div>
                {date && (
                    <TimeIntl
                        className="hidden flex-1 text-ellipsis md:inline-block ml-6"
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
            </div>

            {children}
            <div className="flex items-center">
                {isLargeViewport && onOpenInDocs && openInDocsType && (
                    <Button
                        title={getOpenInDocsString(openInDocsType, mimeType)}
                        onClick={onOpenInDocs}
                        shape="outline"
                        className="mr-4 flex items-center"
                        color="weak"
                        data-testid="file-preview:actions:open-document"
                    >
                        <MimeIcon name={getOpenInDocsMimeIconName(openInDocsType)} className="mr-2" />
                        {getOpenInDocsString(openInDocsType, mimeType)}
                    </Button>
                )}
                {onRestore && (
                    <Button
                        title={c('Action').t`Restore`}
                        onClick={onRestore}
                        shape="solid"
                        className="md:mx-2 lg:mr-4"
                        color="norm"
                        data-testid="file-preview:actions:restore"
                    >
                        {c('Info').t`Restore`}
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
                        className="md:ml-2"
                        data-testid="file-preview:actions:save"
                        loading={isSaving}
                        disabled={!isDirty}
                    >
                        <Icon
                            name={saveError ? 'exclamation-circle-filled' : 'pen'}
                            size={5}
                            alt={c('Action').t`Save`}
                        />
                    </Button>
                )}
                {onDownload && (
                    <Button
                        icon
                        shape="ghost"
                        title={c('Action').t`Download`}
                        onClick={onDownload}
                        className="sm:ml-2 hidden sm:inline-flex"
                        data-testid="file-preview:actions:download"
                    >
                        <IcArrowDownLine size={5} alt={c('Action').t`Download`} />
                    </Button>
                )}
                {onDetails && (
                    <Button
                        icon
                        shape="ghost"
                        title={c('Action').t`Details`}
                        onClick={onDetails}
                        className="md:ml-2 hidden md:inline-flex"
                        data-testid="file-preview:actions:details"
                    >
                        <IcInfoCircle size={5} alt={c('Action').t`Details`} />
                    </Button>
                )}
                {onShare && !isMobileHeaderPreview && (
                    <Button
                        icon
                        shape="ghost"
                        title={c('Action').t`Share`}
                        onClick={onShare}
                        className="md:ml-2 md:inline-flex"
                        data-testid="file-preview:actions:share"
                    >
                        <Icon
                            name={sharedStatus === 'shared' ? 'users' : 'user-plus'}
                            size={5}
                            alt={sharedStatus === '' ? c('Action').t`Share via link` : c('Action').t`Sharing options`}
                            className={SHARED_STATUS_TO_COLOR[sharedStatus || '']}
                        />
                    </Button>
                )}
                {onFavorite && typeof isFavorite !== 'undefined' && !isMobileHeaderPreview && (
                    <Button
                        icon
                        shape="ghost"
                        title={isFavorite ? c('Action').t`Remove from favorites` : c('Action').t`Mark as favorite`}
                        onClick={onFavorite}
                        className="md:ml-2 md:inline-flex"
                        data-testid={
                            isFavorite ? 'file-preview:actions:removefavorite' : 'file-preview:actions:markfavorite'
                        }
                    >
                        <Icon
                            name={isFavorite ? 'heart-filled' : 'heart'}
                            size={5}
                            alt={isFavorite ? c('Action').t`Remove from favorites` : c('Action').t`Mark as favorite`}
                        />
                    </Button>
                )}
                {onSelectCover && !isMobileHeaderPreview && (
                    <Button
                        icon
                        shape="ghost"
                        title={c('Action').t`Set as album cover`}
                        onClick={onSelectCover}
                        className="md:ml-2 md:inline-flex"
                        data-testid="file-preview:actions:selectcover"
                    >
                        <IcWindowImage size={5} alt={c('Action').t`Set as album cover`} />
                    </Button>
                )}
                {onClose && (
                    <Button
                        icon
                        shape="ghost"
                        title={c('Action').t`Close`}
                        onClick={onClose}
                        className="md:ml-2"
                        data-testid="preview:button:close"
                    >
                        <IcCross size={5} alt={c('Action').t`Close`} />
                    </Button>
                )}
            </div>
        </div>
    );
};

export default Header;
