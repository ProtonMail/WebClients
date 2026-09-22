import type { Ref } from 'react';
import { forwardRef } from 'react';

import { c } from 'ttag';

import EasySwitchOauthImportButton from '@proton/activation/src/components/OAuthImportButton/EasySwitchOAuthImportButton';
import { EASY_SWITCH_SOURCES, ImportProvider, ImportType } from '@proton/activation/src/interface';
import { IcLock } from '@proton/icons/icons/IcLock';
import { DRIVE_APP_NAME } from '@proton/shared/lib/constants';

import { EmptyFolderIllustration } from './EmptyFolderIllustration';

interface Props {
    onClick?: () => void;
    dataTestId?: string;
}

export const EmptyRootFolder = forwardRef(({ onClick, dataTestId }: Props, ref: Ref<HTMLDivElement>) => {
    return (
        // onClick is used for context menu, so we don't need to care about keyboard events
        // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
        <div ref={ref} onClick={onClick} className="flex w-full flex-1 overflow-auto relative" data-testid={dataTestId}>
            <div
                className="m-auto flex flex-column items-center gap-4 text-center max-w-custom px-2"
                style={{ '--max-w-custom': '28rem' }}
            >
                <EmptyFolderIllustration />
                <div className="flex flex-column gap-3">
                    <h3 className="text-bold">{c('Title').t`Welcome to ${DRIVE_APP_NAME}`}</h3>
                    <p className="color-weak m-0">
                        {c('Info').t`Drag your files and folders here or use the "New" button to upload`}
                    </p>
                    <p className="color-weak m-0">{c('Info').t`Or import your files from`}</p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-2">
                    <EasySwitchOauthImportButton
                        provider={ImportProvider.GOOGLE}
                        products={[ImportType.DRIVE]}
                        source={EASY_SWITCH_SOURCES.DRIVE_WEB_EMPTY_STATE}
                    />
                </div>
                <div
                    className="flex items-center gap-2 color-weak text-sm absolute bottom-custom"
                    style={{
                        '--bottom-custom': '1.5rem',
                    }}
                >
                    <IcLock size={4} />
                    <span>{c('Info').t`End-to-end encrypted`}</span>
                </div>
            </div>
        </div>
    );
});
EmptyRootFolder.displayName = 'EmptyRootFolder';
