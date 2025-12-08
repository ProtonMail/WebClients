import { c } from 'ttag';

import { MailImportPayloadError } from '@proton/activation/src/interface';
import { IcExclamationCircleFilled } from '@proton/icons/icons/IcExclamationCircleFilled';
import { MAIL_APP_NAME } from '@proton/shared/lib/constants';

interface Props {
    errors: MailImportPayloadError[];
}

const StepPrepareEmailsSummaryError = ({ errors }: Props) => {
    return (
        <div className="flex color-danger">
            <IcExclamationCircleFilled className="mr-2 flex-nowrap" style={{ marginTop: 4 }} />

            <div className="flex-1">
                {errors.includes(MailImportPayloadError.MAX_FOLDERS_LIMIT_REACHED) && (
                    <div className="mb-4">
                        {c('Error')
                            .t`There are too many folders in your external account. Please customize the import to delete some folders.`}
                    </div>
                )}

                {errors.includes(MailImportPayloadError.LABEL_NAMES_TOO_LONG) && (
                    <div className="mb-4">
                        {c('Error')
                            .t`Some of your label names exceed ${MAIL_APP_NAME}'s maximum character limit. Please customize the import to edit these names.`}
                    </div>
                )}

                {errors.includes(MailImportPayloadError.FOLDER_NAMES_TOO_LONG) && (
                    <div className="mb-4">
                        {c('Error')
                            .t`Some of your folder names exceed ${MAIL_APP_NAME}'s maximum character limit. Please customize the import to edit these names.`}
                    </div>
                )}

                {errors.includes(MailImportPayloadError.UNAVAILABLE_NAMES) && (
                    <div className="mb-4">
                        {c('Error')
                            .t`Some of your label names are unavailable. Please customize the import to edit these names.`}
                    </div>
                )}

                {errors.includes(MailImportPayloadError.RESERVED_NAMES) && (
                    <div className="mb-4">
                        {c('Error')
                            .t`Some of your label names are reserved. Please customize the import to edit these names.`}
                    </div>
                )}
            </div>
        </div>
    );
};

export default StepPrepareEmailsSummaryError;
