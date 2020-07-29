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
    PrimaryButton,
} from 'react-components';
import humanSize from 'proton-shared/lib/helpers/humanSize';
import { LinkType } from '../interfaces/link';
import { DriveFolder } from './Drive/DriveFolderProvider';
import useDrive from '../hooks/drive/useDrive';
import { FileBrowserItem } from './FileBrowser/interfaces';

interface Props {
    item: FileBrowserItem;
    activeFolder: DriveFolder;
    onClose?: () => void;
}

const DetailsModal = ({ activeFolder, item, onClose, ...rest }: Props) => {
    const [{ Name }] = useUser();
    const { getLinkMeta } = useDrive();
    const [location, setLocation] = useState('');

    useEffect(() => {
        const getLocationItems = async (linkId: string): Promise<string[]> => {
            const { ParentLinkID, Name } = await getLinkMeta(activeFolder.shareId, linkId);

            if (!ParentLinkID) {
                return [c('Title').t`My files`];
            }

            const previous = await getLocationItems(ParentLinkID);

            return [...previous, Name];
        };

        let canceled = false;

        getLocationItems(activeFolder.linkId)
            .then((items) => {
                if (!canceled) {
                    setLocation(`/${items.join('/')}`);
                }
            })
            .catch(console.error);

        return () => {
            canceled = true;
        };
    }, [activeFolder.shareId, activeFolder.linkId]);

    const modalTitleID = 'details-modal';
    const isFolder = item.Type === LinkType.FOLDER;
    const folderFields = ['Name', 'Uploaded by', 'Location', 'ModifyTime'];
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
            case 'ModifyTime':
                return (
                    <Time key="dateModified" format="PPp">
                        {item.ModifyTime}
                    </Time>
                );
            case 'Extension':
                return <span title={item.MIMEType}>{item.MIMEType}</span>;
            case 'Size':
                return humanSize(item.Size);
            default:
        }
    };

    const rows = fieldsToRender.map((field) => {
        const fieldValue = extractFieldValue(field, item);
        return (
            <Row key={field}>
                <Label style={{ cursor: 'default' }}>{field}</Label>
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
