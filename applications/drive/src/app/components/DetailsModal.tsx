import React, { useEffect, useState } from 'react';
import { c } from 'ttag';

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
import humanSize from 'proton-shared/lib/helpers/humanSize';

import { FileBrowserItem } from './FileBrowser/FileBrowser';
import { ResourceType, LinkMeta } from '../interfaces/link';
import { DriveResource } from './Drive/DriveResourceProvider';

interface Props {
    item: FileBrowserItem;
    resource: DriveResource;
    getLinkMeta: (shareId: string, linkId: string) => Promise<LinkMeta>;
    onClose?: () => void;
}

const DetailsModal = ({ resource, getLinkMeta, item, onClose, ...rest }: Props) => {
    const [{ Name }] = useUser();
    const [location, setLocation] = useState('');

    useEffect(() => {
        const getLocationItems = async (linkId: string): Promise<string[]> => {
            const { ParentLinkID, Name } = await getLinkMeta(resource.shareId, linkId);

            if (!ParentLinkID) {
                return [c('Title').t`My files`];
            }

            const previous = await getLocationItems(ParentLinkID);

            return [...previous, Name];
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
    }, [resource.shareId, resource.linkId]);

    const modalTitleID = 'details-modal';
    const isFolder = item.Type === ResourceType.FOLDER;
    const folderFields = ['Name', 'Uploaded by', 'Location', 'Modified'];
    const fileFields = [...folderFields, 'Extension', 'Size'];
    const fieldsToRender = isFolder ? folderFields : fileFields;
    const title = isFolder ? c('Title').t`Folder Details` : c('Title').t`File Details`;

    const extractFieldValue = (field: string, item: FileBrowserItem) => {
        switch (field) {
            case 'Name':
                return <span title={item.Name}>{item.Name}</span>;
            case 'Uploaded by':
                return <span title={Name}>{Name}</span>;
            case 'Location':
                return <span title={location}>{location}</span>;
            case 'Modified':
                return (
                    <Time key="dateModified" format="PPp">
                        {item.Modified}
                    </Time>
                );
            case 'Extension':
                return <span title={item.MimeType}>{item.MimeType}</span>;
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
