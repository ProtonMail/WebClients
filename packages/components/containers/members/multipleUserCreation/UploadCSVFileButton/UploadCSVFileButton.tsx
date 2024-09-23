import type { ReactNode } from 'react';
import { useState } from 'react';

import { c, msgid } from 'ttag';

import type { ButtonProps } from '@proton/atoms';
import { InlineLinkButton } from '@proton/atoms';
import { useModals, useNotifications } from '@proton/components';
import FileInput from '@proton/components/components/input/FileInput';
import { MIN_PASSWORD_LENGTH } from '@proton/shared/lib/constants';
import clsx from '@proton/utils/clsx';

import type { CsvConfig } from '../csv';
import { downloadSampleCSV, parseMultiUserCsv } from '../csv';
import CsvConversionError, { CSV_CONVERSION_ERROR_TYPE } from '../errors/CsvConversionError';
import { CsvFormatError, TooManyUsersError } from '../errors/CsvFormatErrors';
import type { UserTemplate } from '../types';
import CsvFormatErrorModal from './CsvFormatErrorModal';

export interface Props {
    onUpload: (data: UserTemplate[]) => void;
    className?: string;
    children?: ReactNode;
    color?: ButtonProps['color'];
    csvConfig: CsvConfig;
}

const UploadCSVFileButton = ({
    onUpload,
    className,
    children = c('Select file').t`Upload CSV file`,
    color,
    csvConfig,
}: Props) => {
    const [importing, setImporting] = useState(false);
    const { createNotification } = useNotifications();
    const { createModal } = useModals();

    const csvTemplateButton = (
        <InlineLinkButton
            key="csvTemplateButton"
            onClick={() => {
                return downloadSampleCSV(csvConfig);
            }}
        >
            {
                // translator: full sentence is "Please check your file, or try using our CSV template."
                c('CSV download button').t`CSV template`
            }
        </InlineLinkButton>
    );
    const pleaseCheckYourFileText =
        // translator: full sentence is "Please check your file, or try using our CSV template."
        c('Info').jt`Please check your file, or try using our ${csvTemplateButton}.`;

    const handleFiles = async (files: File[]) => {
        try {
            const { users, errors } = await parseMultiUserCsv(files, csvConfig);

            if (errors.length) {
                const requiredEmailErrors = errors.filter(
                    (error) => error.type === CSV_CONVERSION_ERROR_TYPE.EMAIL_REQUIRED
                );
                const requiredPasswordErrors = errors.filter(
                    (error) => error.type === CSV_CONVERSION_ERROR_TYPE.PASSWORD_REQUIRED
                );
                const passwordMinLengthErrors = errors.filter(
                    (error) => error.type === CSV_CONVERSION_ERROR_TYPE.PASSWORD_LESS_THAN_MIN_LENGTH
                );

                if (requiredEmailErrors.length || requiredPasswordErrors.length | passwordMinLengthErrors.length) {
                    return createModal(
                        <CsvFormatErrorModal>
                            {requiredEmailErrors.length > 0 ? (
                                <p className={clsx('mt-0', !requiredPasswordErrors.length && 'mb-0')}>
                                    {c('Info').ngettext(
                                        msgid`Please add an email address for the user on row`,
                                        `Please add email addresses for the users on rows`,
                                        requiredEmailErrors.length
                                    )}{' '}
                                    {requiredEmailErrors.map((error) => error.rowNumber).join(', ')}
                                </p>
                            ) : null}
                            {requiredPasswordErrors.length > 0 ? (
                                <p className="my-0">
                                    {c('Info').ngettext(
                                        msgid`Please add a password for the user on row`,
                                        `Please add passwords for the users on rows`,
                                        requiredPasswordErrors.length
                                    )}{' '}
                                    {requiredPasswordErrors.map((error) => error.rowNumber).join(', ')}
                                </p>
                            ) : null}

                            {passwordMinLengthErrors.length > 0 ? (
                                <p className="my-0">
                                    {c('Info').t`Password must be ${MIN_PASSWORD_LENGTH} characters or more.`}{' '}
                                    {c('Info').ngettext(
                                        msgid`Affected user is on row`,
                                        `Affected users are on rows`,
                                        passwordMinLengthErrors.length
                                    )}{' '}
                                    {passwordMinLengthErrors.map((error) => error.rowNumber).join(', ')}
                                </p>
                            ) : null}
                        </CsvFormatErrorModal>
                    );
                }

                const invalidTypeErrors = errors.filter(
                    (error) => error.type === CSV_CONVERSION_ERROR_TYPE.INVALID_TYPE
                );
                if (invalidTypeErrors.length) {
                    return createModal(
                        <CsvFormatErrorModal>
                            <p className="mt-0">{c('Info').t`The format of your CSV file is incorrect.`}</p>
                            <p className="mb-0">{pleaseCheckYourFileText}</p>
                        </CsvFormatErrorModal>
                    );
                }
            }

            onUpload(users);
        } catch (error: any) {
            if (!error.message) {
                return;
            }

            if (error instanceof TooManyUsersError) {
                createModal(
                    <CsvFormatErrorModal>
                        <p className="m-0">{error.message}</p>
                    </CsvFormatErrorModal>
                );
                return;
            }

            if (error instanceof CsvConversionError || error instanceof CsvFormatError) {
                createModal(
                    <CsvFormatErrorModal>
                        <p className="mt-0">{error.message}</p>
                        <p className="mb-0">{pleaseCheckYourFileText}</p>
                    </CsvFormatErrorModal>
                );
                return;
            }

            createNotification({
                type: 'error',
                text: error.message,
            });
        }
    };
    return (
        <>
            <FileInput
                className={className}
                accept=".csv"
                onChange={async ({ target }) => {
                    setImporting(true);
                    const files = Array.from(target.files as FileList);
                    await handleFiles(files);
                    setImporting(false);
                }}
                loading={importing}
                color={color}
            >
                {children}
            </FileInput>
        </>
    );
};

export default UploadCSVFileButton;
