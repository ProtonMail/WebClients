import React, { useEffect, useState } from 'react';
import {
    Row,
    Label,
    Field,
    Time,
    useUser,
    DialogModal,
    HeaderModal,
    InnerModal,
    FooterModal,
    PrimaryButton
} from 'react-components';
import { c } from 'ttag';

import humanSize from 'proton-shared/lib/helpers/humanSize';

import { FileBrowserItem } from './FileBrowser/FileBrowser';
import { ResourceType } from '../interfaces/link';
import { DriveResource } from './Drive/DriveResourceProvider';
import useShare from '../hooks/useShare';

interface Props {
    item: FileBrowserItem;
    resource: DriveResource;
    onClose?: () => void;
}

const DetailsModal = ({ resource, item, onClose, ...rest }: Props) => {
    const { getFolderMeta } = useShare(resource.shareId);
    const [{ Name }] = useUser();
    const [location, setLocation] = useState('');

    useEffect(() => {
        const getLocationItems = async (linkId: string): Promise<string[]> => {
            const meta = (await getFolderMeta(linkId)).Folder;
            if (!meta.ParentLinkID) {
                return [c('Title').t`My files`];
            }
            const previous = await getLocationItems(meta.ParentLinkID);

            return [...previous, meta.Name];
        };

        let canceled = false;

        getLocationItems(resource.linkId).then((items) => {
            if (!canceled) {
                setLocation(`\\${items.join('\\')}`);
            }
        });

        return () => {
            canceled = true;
        };
    }, [getFolderMeta, resource.linkId]);

    const modalTitleID = 'details-modal';
    const isFolder = item.Type === ResourceType.FOLDER;
    const folderFields = ['Name', 'Uploaded by', 'Location', 'Modified'];
    const fileFields = [...folderFields, 'Extension', 'Size'];
    const fieldsToRender = isFolder ? folderFields : fileFields;
    const title = isFolder ? c('Title').t`Folder Details` : c('Title').t`File Details`;

    const extractFieldValue = (field: string, item: FileBrowserItem) => {
        switch (field) {
            case 'Name':
                return item.Name;
            case 'Uploaded by':
                return Name;
            case 'Location':
                return <span title={location}>{location}</span>;
            case 'Modified':
                return (
                    <Time key="dateModified" format="PPp">
                        {item.Modified}
                    </Time>
                );
            case 'Extension':
                return item.MimeType;
            case 'Size':
                return humanSize(item.Size);
            default:
                return;
        }
    };

    const rows = fieldsToRender.map((field) => {
        const fieldValue = extractFieldValue(field, item);
        return (
            <Row key={field}>
                <Label>{c('Label').t`${field}`}</Label>
                <Field className="ellipsis">
                    <b>{fieldValue}</b>
                </Field>
            </Row>
        );
    });

    return (
        <DialogModal modalTitleID={modalTitleID} onClose={onClose} {...rest}>
            <HeaderModal modalTitleID={modalTitleID} onClose={onClose}>
                {title}
            </HeaderModal>
            <div className="pm-modalContent">
                <InnerModal>{rows}</InnerModal>
                <FooterModal>
                    <PrimaryButton onClick={onClose} autoFocus>
                        {c('Action').t`Close`}
                    </PrimaryButton>
                </FooterModal>
            </div>
        </DialogModal>
    );
};

export default DetailsModal;
