import { useRef } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { Icon, TimeIntl } from '@proton/components';

import type { DriveFileRevision } from '../../store';
import { useContextMenuControls } from '../FileBrowser';
import { RevisionsItemContextMenu } from './RevisionsItemContextMenu';

import './RevisionListItem.scss';

const RevisionListItem = ({
    revision,
    formatType = 'date',
    isCurrent = false,
}: {
    revision: DriveFileRevision;
    formatType?: 'date' | 'time';
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
                revision={revision}
                isCurrent={isCurrent}
            />
            <li className="revision-list-item mb-4">
                <TimeIntl className="flex-1" options={options}>
                    {revision.createTime}
                </TimeIntl>
                <p className="text-ellipsis text-center m-0">{revision.signatureEmail}</p>
                <Button
                    className="ml-auto"
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
