import React, { useEffect, useState } from 'react';
import { useModals, Loader, useLoading } from 'react-components';
import { RouteComponentProps } from 'react-router';
import { c } from 'ttag';
import Drive, { DriveResource } from '../components/Drive';
import useDrive from '../hooks/useDrive';
import { LinkType } from '../interfaces/folder';
import OnboardingModal from '../components/OnboardingModal/OnboardingModal';
import Page from '../components/Page';
import StickyHeader from '../components/StickyHeader';

const toLinkType = (type: string) => {
    if (type === 'folder') {
        return LinkType.FOLDER;
    }
    if (type === 'file') {
        return LinkType.FILE;
    }
    throw new Error(`Type ${type} is unexpected, must be file or folder`);
};

const toResource = (shareId?: string, type?: string, linkId?: string): DriveResource | undefined => {
    if (shareId && type && linkId) {
        return { shareId, type: toLinkType(type), linkId };
    } else if (!shareId && !type && !linkId) {
        return undefined;
    }
    throw Error('Missing parameters, should be none or shareId/type/linkId');
};

function DriveContainer({ match, history }: RouteComponentProps<{ shareId?: string; linkId?: string; type?: string }>) {
    const { createModal } = useModals();
    const [loading, withLoading] = useLoading();
    const { createVolume, loadDrive } = useDrive();
    const [resource, setResource] = useState<DriveResource>();

    const navigateToResource = (resource: DriveResource) => {
        if (resource.type === LinkType.FOLDER) {
            history.push(`/drive/${resource.shareId}/folder/${resource.linkId}`);
        }
    };

    const redirectToLink = (shareId: string, linkId: string) => history.replace(`/drive/${shareId}/folder/${linkId}`);

    useEffect(() => {
        const { shareId, type, linkId } = match.params;
        let didCancel = false;

        const initDrive = async () => {
            const initResult = await loadDrive();

            if (!initResult) {
                createModal(<OnboardingModal />);
                const { Share } = await createVolume();
                if (!didCancel) {
                    redirectToLink(Share.ID, Share.LinkID);
                }
                return;
            }

            const initialResource = toResource(shareId, type, linkId);

            if (didCancel) {
                return;
            }

            if (initialResource) {
                setResource(initialResource);
            } else {
                const { Share } = initResult;
                redirectToLink(Share.ShareID, Share.LinkID);
            }
        };

        withLoading(initDrive()).catch((error) =>
            setResource(() => {
                throw error;
            })
        );

        return () => {
            didCancel = true;
        };
    }, [match.params]);

    return (
        <Page title={c('Title').t`My files`}>
            <StickyHeader>
                <h3 className="mb0">{c('Title').t`My files`}</h3>
            </StickyHeader>
            {loading ? (
                <Loader size="medium" />
            ) : (
                resource && <Drive resource={resource} openResource={navigateToResource} />
            )}
        </Page>
    );
}

export default DriveContainer;
