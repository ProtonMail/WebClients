import type { FC } from 'react';

import { c } from 'ttag';

import notesImg from '@proton/pass/assets/file-attachments/notes.svg';
import { SpotlightGradient } from '@proton/pass/components/Spotlight/SpotlightGradient';
import { WithSpotlight } from '@proton/pass/components/Spotlight/WithSpotlight';
import { SpotlightMessage } from '@proton/pass/types';

export const FileAttachmentsDiscovery: FC = () => (
    <WithSpotlight type={SpotlightMessage.FILE_ATTACHMENTS_DISCOVERY}>
        {({ close }) => (
            <SpotlightGradient
                title={c('Pass_file_attachments').t`Attachments`}
                message={
                    <div className="max-w-3/4">{c('Pass_file_attachments')
                        .t`You can attach files to items for a better organization`}</div>
                }
                onClose={close}
                className="mb-2"
                backgroundImage={notesImg}
                closeButtonProps={{ icon: 'cross-circle-filled', dark: true }}
            />
        )}
    </WithSpotlight>
);
