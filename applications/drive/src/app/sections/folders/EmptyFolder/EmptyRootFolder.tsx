import type { Ref } from 'react';
import { forwardRef } from 'react';

import { c } from 'ttag';

import EasySwitchOauthImportButton from '@proton/activation/src/components/OAuthImportButton/EasySwitchOAuthImportButton';
import { EASY_SWITCH_SOURCES, ImportProvider, ImportType } from '@proton/activation/src/interface';
import { IcLock } from '@proton/icons/icons/IcLock';
import { DRIVE_APP_NAME } from '@proton/shared/lib/constants';

import { Actions, countActionWithTelemetry } from '../../../utils/telemetry';
import { EmptyFolderIllustration } from './EmptyFolderIllustration';

interface Props {
    onClick?: () => void;
    dataTestId?: string;
}

export const EmptyRootFolder = forwardRef(({ onClick, dataTestId }: Props, ref: Ref<HTMLDivElement>) => {
    return (
        // onClick is used for context menu, so we don't need to care about keyboard events
        // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
        <div
            ref={ref}
            onClick={onClick}
            className="flex flex-column flex-nowrap w-full flex-1 overflow-auto"
            data-testid={dataTestId}
        >
            <div
                className="m-auto flex flex-column flex-nowrap shrink-0 items-center gap-4 text-center max-w-custom px-2"
                style={{ '--max-w-custom': '28rem' }}
            >
                <div className="w-full max-w-custom" style={{ '--max-w-custom': 'min(379px, 45vh)' }}>
                    <EmptyFolderIllustration />
                </div>
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
                        onClick={() => {
                            void countActionWithTelemetry(Actions.EasySwitchGoogleEmptyViewClicked);
                        }}
                    />
                </div>
            </div>
            <div className="shrink-0 flex items-center gap-2 color-weak text-sm mx-auto my-6">
                <IcLock size={4} />
                <span>{c('Info').t`End-to-end encrypted`}</span>
            </div>
        </div>
    );
});
EmptyRootFolder.displayName = 'EmptyRootFolder';
