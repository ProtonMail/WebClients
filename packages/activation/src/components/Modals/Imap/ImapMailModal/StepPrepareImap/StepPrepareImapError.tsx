import { c } from 'ttag';

import { EasyTrans } from '@proton/activation/src/helpers/easyTrans';
import { MailImportPayloadError } from '@proton/activation/src/interface';
import { Alert } from '@proton/components';
import { BRAND_NAME } from '@proton/shared/lib/constants';

interface Props {
    isLabelMapping: boolean;
    errors: MailImportPayloadError[];
    showSizeWarning: boolean;
}

const { FOLDER_NAMES_TOO_LONG, LABEL_NAMES_TOO_LONG, MAX_FOLDERS_LIMIT_REACHED, RESERVED_NAMES, UNAVAILABLE_NAMES } =
    MailImportPayloadError;

const StepPrepareError = ({ isLabelMapping, errors, showSizeWarning }: Props) => {
    const trans = EasyTrans.get(isLabelMapping);

    return (
        <>
            {showSizeWarning && (
                <Alert className="my-4" type="warning">
                    <div className="mb-4">
                        {c('Warning')
                            .t`This import may exceed the storage capacity currently available in your ${BRAND_NAME} account. Please consider customizing your import.`}
                    </div>
                </Alert>
            )}

            {errors.includes(MAX_FOLDERS_LIMIT_REACHED) && (
                <Alert className="my-4" type="error">
                    {c('Error')
                        .t`There are too many folders in your external account. Please customize the import to delete some folders.`}
                </Alert>
            )}

            {(errors.includes(FOLDER_NAMES_TOO_LONG) || errors.includes(LABEL_NAMES_TOO_LONG)) && (
                <Alert className="my-4" type="error">
                    {trans.errorItemsLimit()}
                </Alert>
            )}

            {errors.includes(UNAVAILABLE_NAMES) && (
                <Alert className="my-4" type="error">
                    {trans.errorUnavailableName()}
                </Alert>
            )}

            {errors.includes(RESERVED_NAMES) && (
                <Alert className="my-4" type="error">
                    {trans.errorReservedName()}
                </Alert>
            )}
        </>
    );
};

export default StepPrepareError;
