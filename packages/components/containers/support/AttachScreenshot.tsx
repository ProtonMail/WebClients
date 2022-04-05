import { ChangeEvent, Dispatch, SetStateAction } from 'react';
import { c } from 'ttag';

import { toBlob, resize } from '@proton/shared/lib/helpers/image';
import { MAX_SIZE_SCREENSHOT } from '@proton/shared/lib/constants';
import { removeItem } from '@proton/shared/lib/helpers/array';
import { useNotifications } from '../../hooks';
import { Button, CircleLoader, FileInput, Icon, Info, Table, TableBody, TableRow } from '../../components';

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
                <span className="mr0-5">{c('Label').t`Attach screenshot(s)`}</span>
                <Info url="https://protonmail.com/support/knowledge-base/screenshot-reporting-bugs/" />
            </label>
            <div>
                <FileInput
                    multiple
                    accept="image/*"
                    id={id}
                    onChange={handleChange}
                    disabled={uploading || disabled}
                    color="norm"
                    shape="underline"
                >{c('Action').t`Attach screenshot(s)`}</FileInput>
                {uploading && <CircleLoader className="icon-16p ml1" />}
            </div>
            <Table className="simple-table--has-actions">
                <TableBody>
                    {screenshots.map((screenshot) => {
                        return (
                            <TableRow
                                key={screenshot.name}
                                cells={[
                                    <div
                                        key={1}
                                        className="flex flex-row flex-nowrap flex-align-items-center flex-justify-space-between"
                                    >
                                        <span className="max-w100 inline-block text-ellipsis" title={screenshot.name}>
                                            {screenshot.name}
                                        </span>
                                        <Button
                                            className="ml0-5"
                                            icon
                                            color="weak"
                                            shape="outline"
                                            onClick={() => removeUploadedScreenShot(screenshot)}
                                        >
                                            <Icon name="trash" alt={c('Label').t`Delete`} />
                                        </Button>
                                    </div>,
                                ]}
                                className="on-mobile-hide-td2 on-tiny-mobile-hide-td3"
                            />
                        );
                    })}
                </TableBody>
            </Table>
        </>
    );
};

export default AttachScreenshot;
