import React, { useEffect, useState } from 'react';
import Page, { PageMainArea } from '../components/Page';
import DriveContentProvider from '../components/Drive/DriveContentProvider';
import { c } from 'ttag';
import TrashToolbar from '../components/Drive/Trash/TrashToolbar';
import StickyHeader from '../components/StickyHeader';
import Trash from '../components/Drive/Trash/Trash';
import { RouteComponentProps } from 'react-router-dom';
import useDrive from '../hooks/useDrive';
import { useDriveResource } from '../components/Drive/DriveResourceProvider';
import { FileBrowserItem } from '../components/FileBrowser/FileBrowser';
import useFileBrowser from '../components/FileBrowser/useFileBrowser';

const TrashContainer = ({ match }: RouteComponentProps<{ shareId?: string }>) => {
    const { loadDrive } = useDrive();
    const [, setError] = useState();
    const { setResource } = useDriveResource();
    const [shareId, setShareId] = useState(() => match.params.shareId);
    const [contents, setContents] = useState<FileBrowserItem[]>([]);
    const fileBrowserControls = useFileBrowser(contents);

    useEffect(() => {
        setResource(undefined);

        const initDrive = async () => {
            if (!shareId) {
                const initResult = await loadDrive();

                if (!initResult) {
                    throw new Error('Drive is not initilized, cache has been cleared unexpectedly');
                }

                setShareId(initResult.Share.ShareID);
            } else if (match.params.shareId !== shareId) {
                setShareId(match.params.shareId);
            }
        };

        initDrive().catch((error) =>
            setError(() => {
                throw error;
            })
        );
    }, [match.params.shareId]);

    return (
        <Page title={c('Title').t`My files`}>
            <DriveContentProvider>
                <TrashToolbar />
                <PageMainArea hasToolbar className="flex flex-column">
                    <StickyHeader>
                        <div className="pt0-5 pb0-5 pl0-25 pr0-25 strong">{c('Info').t`Trash`}</div>
                    </StickyHeader>
                    {shareId && (
                        <Trash
                            fileBrowserControls={fileBrowserControls}
                            contents={contents}
                            setContents={setContents}
                            shareId={shareId}
                        />
                    )}
                </PageMainArea>
            </DriveContentProvider>
        </Page>
    );
};

export default TrashContainer;
