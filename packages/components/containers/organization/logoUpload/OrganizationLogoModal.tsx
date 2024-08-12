import type { ChangeEvent, ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';

import { c } from 'ttag';

import { Button, CircleLoader } from '@proton/atoms';
import { useLoading } from '@proton/hooks';
import metrics, { observeApiError } from '@proton/metrics';
import { updateOrganizationLogo, updateOrganizationSettings } from '@proton/shared/lib/api/organization';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import { toBase64 } from '@proton/shared/lib/helpers/file';
import humanSize from '@proton/shared/lib/helpers/humanSize';
import { extractBase64Image, resizeImage, toBlob } from '@proton/shared/lib/helpers/image';
import type { Organization } from '@proton/shared/lib/interfaces';
import clsx from '@proton/utils/clsx';
import noop from '@proton/utils/noop';

import type { ModalProps } from '../../../components';
import {
    Dropzone,
    FileInput,
    Form,
    Icon,
    ModalTwo as Modal,
    ModalTwoContent as ModalContent,
    ModalTwoFooter as ModalFooter,
    ModalTwoHeader as ModalHeader,
    useFormErrors,
} from '../../../components';
import { useApi, useEventManager, useNotifications } from '../../../hooks';
import SidebarPreview from './SidebarPreview';
import useOrgLogoUploadTelemetry from './useOrgLogoUploadTelemetry';

interface Props extends ModalProps {
    organization: Organization;
    app: APP_NAMES;
}

interface UploadedLogo {
    name: string;
    size: number;
    image: string;
}

const OrganizationLogoModal = ({ onClose, organization, app, ...rest }: Props) => {
    const api = useApi();
    const { call } = useEventManager();
    const [loading, withLoading] = useLoading();
    const { onFormSubmit } = useFormErrors();
    const [uploadedLogo, setUploadedLogo] = useState<UploadedLogo | undefined>();
    const uploadedUrl = useRef<string | undefined>(undefined);
    const [uploading, setUploading] = useState<boolean>(false);
    const [showUploadLoader, setShowUploadLoader] = useState<boolean>(false);
    const [error, setError] = useState<ReactNode>();
    const { createNotification } = useNotifications();

    const { sendOrgLogoUploadStartProcessReport, sendOrgLogoUploadSuccessReport, sendOrgLogoUploadFailureReport } =
        useOrgLogoUploadTelemetry();

    const handleSubmit = async () => {
        if (!uploadedLogo) {
            return;
        }

        try {
            const { base64 } = extractBase64Image(uploadedLogo.image);
            await api(updateOrganizationLogo(base64));
            // Set ShowName to true here, this might get its own setting in the future
            await api(updateOrganizationSettings({ ShowName: true }));
            await call();

            metrics.core_lightLabelling_logoUpload_total.increment({
                status: 'success',
            });

            sendOrgLogoUploadSuccessReport();
            createNotification({ text: c('Success').t`Organization logo updated` });
            onClose?.();
        } catch (error) {
            observeApiError(error, (status) =>
                metrics.core_lightLabelling_logoUpload_total.increment({
                    status,
                })
            );

            sendOrgLogoUploadFailureReport();
        }
    };

    useEffect(() => {
        sendOrgLogoUploadStartProcessReport();

        return () => {
            if (uploadedUrl.current) {
                URL.revokeObjectURL(uploadedUrl.current);
            }
        };
    }, []);

    useEffect(() => {
        let timeout: NodeJS.Timeout;

        if (uploading) {
            timeout = setTimeout(() => setShowUploadLoader(true), 500);
        } else {
            setShowUploadLoader(false);
        }

        return () => clearTimeout(timeout);
    }, [uploading]);

    const handleClose = loading ? noop : onClose;

    const removeLogo = () => {
        setUploadedLogo(undefined);
        uploadedUrl.current = '';
    };

    const processAndUploadLogo = async (files: File[] | FileList | null) => {
        setUploading(true);

        const MAX_FILE_SIZE = 30 * 1024; // 30kb in bytes
        const ALLOWED_FILES_TYPES = ['image/jpeg', 'image/png'];
        const MIN_FILE_DIMENSIONS = 128;
        const MAX_FILE_DIMENSIONS = 1024;

        try {
            const targetImages = files ? [...files].filter(({ type }) => /^image\//i.test(type)) : [];

            if (!targetImages.length) {
                removeLogo();
                return setError(c('Error').t`No image selected`);
            }

            if (targetImages.length > 1) {
                removeLogo();
                return setError(c('Error').t`Please upload only 1 file`);
            }

            const logo = targetImages[0];

            if (!ALLOWED_FILES_TYPES.includes(logo.type)) {
                removeLogo();
                return setError(c('Error').t`Incorrect file type. Upload a file in PNG or JPEG format.`);
            }

            if (logo.size > MAX_FILE_SIZE) {
                removeLogo();
                return setError(c('Error').t`File too large. Your logo must be 30 KB or smaller.`);
            }

            await new Promise<void>((resolve, reject) => {
                const image = new Image();
                const imageUrl = URL.createObjectURL(logo);

                image.onload = async () => {
                    const handleImageUploadError = (message: ReactNode) => {
                        removeLogo();
                        setError(message);
                        URL.revokeObjectURL(imageUrl);
                        setUploading(false);
                    };

                    if (image.width !== image.height) {
                        handleImageUploadError(c('Error').t`Please upload a square file`);
                        return;
                    }

                    if (image.width < MIN_FILE_DIMENSIONS) {
                        handleImageUploadError(
                            c('Error')
                                .jt`The file is too small, the minimum size is ${MIN_FILE_DIMENSIONS}x${MIN_FILE_DIMENSIONS}`
                        );
                        return;
                    }

                    if (image.width > MAX_FILE_DIMENSIONS) {
                        handleImageUploadError(
                            c('Error')
                                .jt`The file is too big, the maximum size is ${MAX_FILE_DIMENSIONS}x${MAX_FILE_DIMENSIONS}`
                        );
                        return;
                    }

                    try {
                        const base64str = await toBase64(logo);
                        const rezisedImage = await resizeImage({
                            original: base64str,
                            maxWidth: MIN_FILE_DIMENSIONS,
                            maxHeight: MIN_FILE_DIMENSIONS,
                            finalMimeType: logo.type,
                            encoderOptions: 0.99,
                            transparencyAllowed: false,
                        });

                        const url = URL.createObjectURL(toBlob(rezisedImage));
                        const processedLogo = {
                            name: logo.name,
                            size: logo.size,
                            image: rezisedImage,
                        };
                        if (uploadedUrl.current) {
                            URL.revokeObjectURL(uploadedUrl.current);
                        }
                        uploadedUrl.current = url;
                        setUploadedLogo(processedLogo);
                        setError(null);
                        resolve();

                        metrics.core_lightLabelling_imageProcessing_total.increment({
                            status: 'success',
                        });
                    } catch (error) {
                        setError(c('Error').t`Failed to process the logo`);

                        metrics.core_lightLabelling_imageProcessing_total.increment({
                            status: 'failure',
                        });
                    } finally {
                        URL.revokeObjectURL(imageUrl);
                    }
                };

                image.onerror = reject;
                image.src = imageUrl;
            });
        } finally {
            setUploading(false);
        }
    };

    const handleChange = async ({ target }: ChangeEvent<HTMLInputElement>) => {
        setError(null);
        await processAndUploadLogo(target.files);
    };

    const handleDrop = async (files: File[]) => {
        setError(null);
        await processAndUploadLogo(files);
    };

    const logoUrl = uploadedUrl?.current || '';

    const renderFileStatusBox = () => {
        if (showUploadLoader) {
            return <CircleLoader className="color-primary" size="medium" />;
        }

        if (logoUrl) {
            return (
                <div className="flex flex-column items-center w-full gap-2 mt-2">
                    <img
                        src={logoUrl}
                        data-testid="llb:image"
                        alt=""
                        className="w-custom h-custom border shrink-0 grow-0"
                        style={{
                            '--w-custom': '2.25rem',
                            '--h-custom': '2.25rem',
                        }}
                    />
                    {uploadedLogo && (
                        <div className="flex flex-column flex-nowrap text-sm w-full">
                            <span className="text-ellipsis" data-testid="llb:fileName">
                                {uploadedLogo.name}
                            </span>
                            <span className="color-weak text-nowrap block shrink-0">
                                {humanSize({
                                    bytes: uploadedLogo.size,
                                    unit: 'KB',
                                    fraction: 1,
                                })}
                            </span>
                        </div>
                    )}
                    <Button onClick={removeLogo} shape="ghost" size="small" icon className="top-0 right-0 absolute">
                        <Icon name="cross" />
                    </Button>
                </div>
            );
        }

        return <Icon name="arrow-up-line" />;
    };

    const DropzoneContent = () => {
        return (
            <div className="flex justify-center md:justify-start items-center gap-4 w-full">
                <div
                    className={clsx(
                        'relative flex justify-center items-center ratio-square w-custom border rounded grow-0 p-2',
                        !logoUrl && 'bg-weak'
                    )}
                    style={{ '--w-custom': '7rem' }}
                >
                    {renderFileStatusBox()}
                </div>
                <div>
                    <p className="mt-0 mb-2">
                        <span>
                            {
                                // Translator: Full sentence Drop image file here to upload or select file
                                c('Organization logo upload modal').t`Drop image file here to upload or`
                            }
                        </span>
                        <FileInput
                            accept="image/png, image/jpeg"
                            id="upload-logo"
                            onChange={handleChange}
                            disabled={uploading}
                            loading={uploading}
                            shape="underline"
                            color="norm"
                            className="m-0 p-1 inline-block mb-0.5"
                        >
                            {
                                // Translator: Full sentence Drop image file here to upload or select file
                                c('Action').t`select file`
                            }
                        </FileInput>
                    </p>
                    <ul className="unstyled text-sm color-weak text-left m-0">
                        <li>
                            <Icon name="checkmark" className="shrink-0 mr-1" />
                            {c('Organization logo upload modal').t`Square image of at least 128 pixels`}
                        </li>
                        <li>
                            <Icon name="checkmark" className="shrink-0 mr-1" />
                            {c('Organization logo upload modal').t`File in PNG or JPEG format`}
                        </li>
                        <li>
                            <Icon name="checkmark" className="shrink-0 mr-1" />
                            {c('Organization logo upload modal').t`File not larger than 30 KB`}
                        </li>
                    </ul>
                </div>
            </div>
        );
    };

    return (
        <Modal
            as={Form}
            onSubmit={() => {
                if (!onFormSubmit()) {
                    return;
                }
                void withLoading(handleSubmit());
            }}
            onClose={handleClose}
            {...rest}
        >
            <ModalHeader title={c('Title').t`Upload your organization’s logo`} />
            <ModalContent>
                <p>{c('Organization logo upload modal')
                    .t`Users will see your logo instead of the ${BRAND_NAME} icon when signed in on our web apps.`}</p>

                <Dropzone
                    onDrop={handleDrop}
                    shape="flashy"
                    customContent={
                        <div className="w-full h-full flex flex-column items-center justify-center text-center">
                            <div>{c('Info').t`Drop file here to upload`}</div>
                        </div>
                    }
                >
                    <div
                        className={clsx(
                            'rounded-xl p-4 flex flex-column items-center justify-center text-center',
                            error ? 'border border-danger' : 'border-dashed border-weak'
                        )}
                    >
                        <DropzoneContent />
                    </div>
                </Dropzone>
                {error && (
                    <p className="text-sm text-semibold color-danger my-1 flex items-center">
                        <Icon name="exclamation-circle-filled" className="shrink-0 mr-1" />
                        <span>{error}</span>
                    </p>
                )}

                {logoUrl && (
                    <div className="mt-6">
                        <h3 className="text-rg text-bold mb-2">{c('Info').t`Preview`}</h3>

                        <div className="w-full flex flex-column md:flex-row flex-nowrap md:justify-space-between gap-4">
                            <SidebarPreview
                                app={app}
                                imageUrl={logoUrl}
                                organizationName={organization.Name}
                                variant="dark"
                                organizationNameDataTestId="llb:organization-name-1"
                            />
                            <SidebarPreview
                                app={app}
                                imageUrl={logoUrl}
                                organizationName={organization.Name}
                                variant="light"
                                organizationNameDataTestId="llb:organization-name-2"
                            />
                        </div>
                    </div>
                )}
            </ModalContent>
            <ModalFooter>
                <Button onClick={handleClose} disabled={loading}>
                    {c('Action').t`Cancel`}
                </Button>
                <Button loading={loading} type="submit" color="norm" disabled={!uploadedLogo}>
                    {c('Action').t`Save`}
                </Button>
            </ModalFooter>
        </Modal>
    );
};

export default OrganizationLogoModal;
