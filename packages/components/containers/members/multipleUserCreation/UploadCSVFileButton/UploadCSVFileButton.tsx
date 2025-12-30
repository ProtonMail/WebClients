import type { ReactNode } from 'react';
import { useState } from 'react';

import { c, msgid } from 'ttag';

import type { ButtonProps } from '@proton/atoms/Button/Button';
import { InlineLinkButton } from '@proton/atoms/InlineLinkButton/InlineLinkButton';
import FileInput from '@proton/components/components/input/FileInput';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import useNotifications from '@proton/components/hooks/useNotifications';
import { MIN_PASSWORD_LENGTH } from '@proton/shared/lib/constants';

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
    const [errorModalProps, setErrorModalOpen, renderErrorModal] = useModalState();
    const [errors, setErrors] = useState<ReactNode[]>([]);

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
        const jsxErrors: ReactNode[] = [];

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

                if (requiredEmailErrors.length || requiredPasswordErrors.length || passwordMinLengthErrors.length) {
                    if (requiredEmailErrors.length > 0) {
                        jsxErrors.push(
                            <>
                                {c('Info').ngettext(
                                    msgid`Please add an email address for the user on row`,
                                    `Please add email addresses for the users on rows`,
                                    requiredEmailErrors.length
                                )}{' '}
                                {requiredEmailErrors.map((error) => error.rowNumber).join(', ')}
                            </>
                        );
                    }
                    if (requiredPasswordErrors.length > 0) {
                        jsxErrors.push(
                            <>
                                {c('Info').ngettext(
                                    msgid`Please add a password for the user on row`,
                                    `Please add passwords for the users on rows`,
                                    requiredPasswordErrors.length
                                )}{' '}
                                {requiredPasswordErrors.map((error) => error.rowNumber).join(', ')}
                            </>
                        );
                    }
                    if (passwordMinLengthErrors.length) {
                        jsxErrors.push(
                            <>
                                {c('Info').t`Password must be ${MIN_PASSWORD_LENGTH} characters or more.`}{' '}
                                {c('Info').ngettext(
                                    msgid`Affected user is on row`,
                                    `Affected users are on rows`,
                                    passwordMinLengthErrors.length
                                )}{' '}
                                {passwordMinLengthErrors.map((error) => error.rowNumber).join(', ')}
                            </>
                        );
                    }
                }

                const invalidTypeErrors = errors.filter(
                    (error) => error.type === CSV_CONVERSION_ERROR_TYPE.INVALID_TYPE
                );
                if (invalidTypeErrors.length) {
                    jsxErrors.push(c('Info').t`The format of your CSV file is incorrect.`, pleaseCheckYourFileText);
                }
            }

            if (jsxErrors.length) {
                return;
            }

            onUpload(users);
        } catch (error: any) {
            if (!error.message) {
                return;
            }

            if (error instanceof TooManyUsersError) {
                jsxErrors.push(error.message);
                return;
            }

            if (error instanceof CsvConversionError || error instanceof CsvFormatError) {
                jsxErrors.push(error.message, pleaseCheckYourFileText);
                return;
            }

            createNotification({
                type: 'error',
                text: error.message,
            });
        } finally {
            if (jsxErrors.length) {
                setErrors(jsxErrors);
                setErrorModalOpen(true);
            }
        }
    };
    return (
        <>
            {renderErrorModal && (
                <CsvFormatErrorModal
                    {...errorModalProps}
                    onExit={() => {
                        setErrors([]);
                        errorModalProps.onExit();
                    }}
                >
                    <div className="flex flex-column gap-2">
                        {errors.map((node, index) => {
                            return (
                                // eslint-disable-next-line react/no-array-index-key
                                <p key={index} className="m-0">
                                    {node}
                                </p>
                            );
                        })}
                    </div>
                </CsvFormatErrorModal>
            )}
            <FileInput
                className={className}
                accept=".csv"
                onChange={async ({ target }) => {
                    if (target.files && target.files.length) {
                        setImporting(true);
                        const files = Array.from(target.files);
                        await handleFiles(files);
                        setImporting(false);
                    }
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
