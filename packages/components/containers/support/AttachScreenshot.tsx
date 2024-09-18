import type { ChangeEvent, Dispatch, SetStateAction } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import Icon from '@proton/components/components/icon/Icon';
import FileInput from '@proton/components/components/input/FileInput';
import Info from '@proton/components/components/link/Info';
import { MAX_SIZE_SCREENSHOT } from '@proton/shared/lib/constants';
import { resize, toBlob } from '@proton/shared/lib/helpers/image';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import removeItem from '@proton/utils/removeIndex';

import { Table, TableBody, TableCell, TableRow } from '../../components';
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

        const duplicatedFilenamesNotification = () => {
            createNotification({
                type: 'warning',
                text: c('Notification for duplicate filenames in the current upload')
                    .t`Some images were not uploaded due to duplicate filenames in the current selection.`,
            });
        };

        try {
            const targetImages = target.files ? [...target.files].filter(({ type }) => /^image\//i.test(type)) : [];

            if (!targetImages.length) {
                return createNotification({
                    type: 'error',
                    text: c('Error notification in the bug report modal when the user upload file')
                        .t`No image selected`,
                });
            }

            const filenames = new Set();
            const uniqueTargetImages = targetImages.filter((image) => {
                const isUnique = !filenames.has(image.name);
                filenames.add(image.name);
                return isUnique;
            });

            if (uniqueTargetImages.length < targetImages.length) {
                duplicatedFilenamesNotification();
            }

            const existingScreenshotNames = new Set(screenshots.map((s) => s.name));
            const processedScreenshots = (
                await Promise.all(
                    uniqueTargetImages.map((img) =>
                        resize(img, MAX_SIZE_SCREENSHOT).then((base64str) => ({
                            name: img.name,
                            blob: toBlob(base64str),
                        }))
                    )
                )
            ).filter((screenshot) => {
                const isUniqueAcrossUploads = !existingScreenshotNames.has(screenshot.name);
                if (!isUniqueAcrossUploads) {
                    duplicatedFilenamesNotification();
                }
                return isUniqueAcrossUploads;
            });

            if (processedScreenshots.length) {
                setScreenshots([...screenshots, ...processedScreenshots]);
            }
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
                <span className="mr-2 align-middle">{c('Label').t`Attach screenshot(s)`}</span>
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
                                    <TableCell className="w-custom" style={{ '--w-custom': '4em' }}>
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
