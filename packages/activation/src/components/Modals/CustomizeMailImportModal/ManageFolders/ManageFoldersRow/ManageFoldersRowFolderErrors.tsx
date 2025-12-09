import { c } from 'ttag';

import { EasyTrans } from '@proton/activation/src/helpers/easyTrans';
import { MailImportPayloadError } from '@proton/activation/src/interface';
import { Tooltip, TooltipTypeEnum } from '@proton/atoms/Tooltip/Tooltip';
import { IcInfoCircle } from '@proton/icons/icons/IcInfoCircle';
import { BRAND_NAME, MAIL_APP_NAME } from '@proton/shared/lib/constants';

interface Props {
    isSystemFolderChild: boolean;
    checked: boolean;
    errors: MailImportPayloadError[];
}

const ManageFoldersRowFolderErrors = ({ isSystemFolderChild, checked, errors }: Props) => {
    const trans = EasyTrans.get(false);
    const tooLong = errors.includes(MailImportPayloadError.FOLDER_NAMES_TOO_LONG);
    const alreadyUsed = errors.includes(MailImportPayloadError.UNAVAILABLE_NAMES);
    const mergeWarning = errors.includes(MailImportPayloadError.MERGE_WARNING);

    return checked ? (
        <div className="shrink-0 inline-flex self-center shrink-0 ml-2">
            {tooLong && (
                <Tooltip title={trans.errorNameTooLong()} type={TooltipTypeEnum.Error}>
                    <IcInfoCircle tabIndex={-1} className="color-danger" />
                </Tooltip>
            )}

            {alreadyUsed && !tooLong && (
                <Tooltip title={trans.errorNameAlreadyExists()} type={TooltipTypeEnum.Error}>
                    <IcInfoCircle tabIndex={-1} className="color-danger" />
                </Tooltip>
            )}

            {mergeWarning && (
                <Tooltip
                    title={c('Warning')
                        .t`${BRAND_NAME} will merge all folders with the same name. To avoid this, change the names before import.`}
                    type={TooltipTypeEnum.Warning}
                >
                    <IcInfoCircle tabIndex={-1} className="color-warning" />
                </Tooltip>
            )}
            {isSystemFolderChild && !mergeWarning && (
                <Tooltip title={c('Tooltip').t`System subfolders will show up as separate folders in ${MAIL_APP_NAME}`}>
                    <IcInfoCircle tabIndex={-1} />
                </Tooltip>
            )}
        </div>
    ) : null;
};

export default ManageFoldersRowFolderErrors;
