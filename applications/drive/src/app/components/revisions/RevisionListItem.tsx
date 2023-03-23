import { useRef } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { Icon, TimeIntl } from '@proton/components';
import { DriveFileRevision } from '@proton/shared/lib/interfaces/drive/file';

import { useContextMenuControls } from '../FileBrowser';
import { RevisionsItemContextMenu } from './RevisionsItemContextMenu';

const RevisionListItem = ({
    revisionId,
    createTime,
    formatType = 'date',
    havePreviewAvailable,
    isCurrent = false,
}: {
    revisionId: DriveFileRevision['ID'];
    createTime: number;
    formatType?: 'date' | 'time';
    havePreviewAvailable: boolean;
    isCurrent?: boolean;
}) => {
    const contextMenuControls = useContextMenuControls();
    const ref = useRef<HTMLButtonElement>(null);
    const options: Intl.DateTimeFormatOptions =
        formatType === 'date'
            ? {
                  month: 'short',
                  day: 'numeric',
              }
            : {
                  hour: 'numeric',
                  minute: 'numeric',
              };
    return (
        <>
            <RevisionsItemContextMenu
                anchorRef={ref}
                isOpen={contextMenuControls.isOpen}
                position={contextMenuControls.position}
                open={contextMenuControls.open}
                close={contextMenuControls.close}
                havePreviewAvailable={havePreviewAvailable}
                revisionId={revisionId}
                isCurrent={isCurrent}
            />
            <li className="flex flex-justify-space-between flex-align-items-center">
                <TimeIntl className="flex-item-fluid" options={options}>
                    {createTime}
                </TimeIntl>
                <Button
                    ref={ref}
                    shape="ghost"
                    size="small"
                    icon
                    onClick={(e) => {
                        contextMenuControls.handleContextMenu(e);
                    }}
                    onTouchEnd={(e) => {
                        contextMenuControls.handleContextMenuTouch(e);
                    }}
                >
                    <Icon name="three-dots-vertical" alt={c('Action').t`More options`} />
                </Button>
            </li>
        </>
    );
};

export default RevisionListItem;
