import { ChangeEvent, Dispatch, SetStateAction } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { MAX_SIZE_SCREENSHOT } from '@proton/shared/lib/constants';
import { resize, toBlob } from '@proton/shared/lib/helpers/image';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import removeItem from '@proton/utils/removeIndex';

import { FileInput, Icon, Info, Table, TableBody, TableCell, TableRow } from '../../components';
import { useNotifications } from '../../hooks';

export interface Screenshot {
    name: string;
    blob: Blob;
}

interface Props {
    id: string;
    screenshots: Screenshot[];
    setScreenshots: Dispatch<SetStateAction<Screenshot[]>>;
    uploading: boolean;
    setUploading: Dispatch<SetStateAction<boolean>>;
    disabled?: boolean;
}

const AttachScreenshot = ({ id, screenshots, setScreenshots, uploading, setUploading, disabled }: Props) => {
    const { createNotification } = useNotifications();

    const handleChange = async ({ target }: ChangeEvent<HTMLInputElement>) => {
        setUploading(true);

        try {
            const targetImages = target.files ? [...target.files].filter(({ type }) => /^image\//i.test(type)) : [];

            if (!targetImages.length) {
                return createNotification({
                    type: 'error',
                    text: c('Error notification in the bug report modal when the user upload file')
                        .t`No image selected`,
                });
            }

            const uploadedScreenshots = await Promise.all(
                targetImages.map((img) =>
                    resize(img, MAX_SIZE_SCREENSHOT).then((base64str) => ({
                        name: img.name,
                        blob: toBlob(base64str),
                    }))
                )
            );
            setScreenshots(uploadedScreenshots);
        } finally {
            setUploading(false);
        }
    };

    const removeUploadedScreenShot = (screenshot: Screenshot) => {
        const index = screenshots.indexOf(screenshot);

        if (index === -1) {
            return;
        }

        setScreenshots((items) => removeItem(items, index));
    };

    return (
        <>
            <label className="text-semibold block" htmlFor={id}>
                <span className="mr0-5 align-middle">{c('Label').t`Attach screenshot(s)`}</span>
                <Info url={getKnowledgeBaseUrl('/screenshot-reporting-bugs')} />
            </label>
            <div>
                <FileInput
                    multiple
                    accept="image/bmp, image/apng, image/png, image/jpeg, image/gif, image/tiff, image/webp"
                    id={id}
                    onChange={handleChange}
                    disabled={uploading || disabled}
                    loading={uploading}
                    color="norm"
                    shape="underline"
                >
                    {c('Action').t`Attach screenshot(s)`}
                </FileInput>
            </div>
            {screenshots.length > 0 && (
                <Table hasActions>
                    <TableBody>
                        {screenshots.map((screenshot) => {
                            return (
                                <TableRow key={screenshot.name}>
                                    <TableCell>
                                        <div key={1} className="text-ellipsis" title={screenshot.name}>
                                            {screenshot.name}
                                        </div>
                                    </TableCell>
                                    <TableCell className="w4e">
                                        <Button
                                            icon
                                            color="weak"
                                            shape="outline"
                                            onClick={() => removeUploadedScreenShot(screenshot)}
                                        >
                                            <Icon name="trash" alt={c('Label').t`Delete`} />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            )}
        </>
    );
};

export default AttachScreenshot;
