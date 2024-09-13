import type { ReactNode } from 'react';
import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import FileNameDisplay from '@proton/components/components/fileNameDisplay/FileNameDisplay';
import Icon from '@proton/components/components/icon/Icon';
import MimeIcon from '@proton/components/components/icon/MimeIcon';
import { useLoading } from '@proton/hooks';
import { getOpenInDocsString } from '@proton/shared/lib/drive/translations';
import { isMobile } from '@proton/shared/lib/helpers/browser';
import { isElectronMail, isElectronOnMac } from '@proton/shared/lib/helpers/desktop';
import clsx from '@proton/utils/clsx';

import { TimeIntl, useActiveBreakpoint } from '../../';
import { FileIcon } from '../../components';

const SHARED_STATUS_TO_COLOR = {
    '': undefined,
    shared: 'color-info',
    inactive: 'color-weak',
};

export type SharedStatus = '' | 'shared' | 'inactive';

interface Props {
    name?: string;
    mimeType?: string;
    isSharingInviteAvailable?: boolean; // Feature flag for drive direct sharing
    sharedStatus?: SharedStatus;
    signatureStatus?: ReactNode;
    isDirty?: boolean;
    onClose?: () => void;
    onDownload?: () => void;
    onSave?: () => Promise<void>;
    onDetails?: () => void;
    onShare?: () => void;
    onRestore?: () => void; // revision's specific
    onOpenInDocs?: () => void;
    date?: Date | string | number;
    children?: ReactNode;
}

const Header = ({
    mimeType,
    name,
    isSharingInviteAvailable,
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

    const shareLinkTitleLEGACY = sharedStatus === '' ? c('Action').t`Share via link` : c('Action').t`Sharing options`;

    return (
        <div className={clsx('file-preview-header flex justify-space-between items-center relative', headerSpacing)}>
            <div className="file-preview-filename flex items-center flex-nowrap" data-testid="preview:file-name">
                {mimeType && <FileIcon mimeType={mimeType} className="mr-2" />}
                <FileNameDisplay text={name} className="user-select" data-testid="file-preview:file-name" />
                {signatureStatus}
            </div>
            {date && (
                <TimeIntl
                    className="flex-1 text-ellipsis ml-5"
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
            <div className="flex items-center">
                {isLargeViewport && onOpenInDocs && (
                    <Button
                        title={getOpenInDocsString(mimeType)}
                        onClick={onOpenInDocs}
                        shape="outline"
                        className="mr-4 flex items-center"
                        color="weak"
                        data-testid="file-preview:actions:open-in-docs"
                    >
                        <MimeIcon name="proton-doc" className="mr-2" />
                        {getOpenInDocsString(mimeType)}
                    </Button>
                )}
                {onRestore && (
                    <Button
                        title={c('Action').t`Restore`}
                        onClick={onRestore}
                        shape="solid"
                        className="mx-2 lg:mr-4"
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
                        <Icon name="arrow-down-line" size={5} alt={c('Action').t`Download`} />
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
                            size={5}
                            alt={c('Action').t`Save`}
                        />
                    </Button>
                )}
                {onDetails && (
                    <Button
                        icon
                        shape="ghost"
                        title={c('Action').t`Details`}
                        onClick={onDetails}
                        className="ml-2 hidden md:inline-flex"
                        data-testid="file-preview:actions:details"
                    >
                        <Icon name="info-circle" size={5} alt={c('Action').t`Details`} />
                    </Button>
                )}
                {onShare && !isMobileHeaderPreview && (
                    <Button
                        icon
                        shape="ghost"
                        title={isSharingInviteAvailable ? c('Action').t`Share` : shareLinkTitleLEGACY}
                        onClick={onShare}
                        className="ml-2 md:inline-flex"
                        data-testid="file-preview:actions:share"
                    >
                        <Icon
                            name={
                                isSharingInviteAvailable ? (sharedStatus === 'shared' ? 'users' : 'user-plus') : 'link'
                            }
                            size={5}
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
                        <Icon name="cross" size={5} alt={c('Action').t`Close`} />
                    </Button>
                )}
            </div>
        </div>
    );
};

export default Header;
