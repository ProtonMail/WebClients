import { c } from 'ttag';

import { EasyTrans } from '@proton/activation/src/helpers/easyTrans';
import { MailImportPayloadError } from '@proton/activation/src/interface';
import { Tooltip, TooltipTypeEnum } from '@proton/atoms';
import { Icon } from '@proton/components';
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
                    <Icon tabIndex={-1} name="info-circle" className="color-danger" />
                </Tooltip>
            )}

            {alreadyUsed && !tooLong && (
                <Tooltip title={trans.errorNameAlreadyExists()} type={TooltipTypeEnum.Error}>
                    <Icon tabIndex={-1} name="info-circle" className="color-danger" />
                </Tooltip>
            )}

            {mergeWarning && (
                <Tooltip
                    title={c('Warning')
                        .t`${BRAND_NAME} will merge all folders with the same name. To avoid this, change the names before import.`}
                    type={TooltipTypeEnum.Warning}
                >
                    <Icon tabIndex={-1} name="info-circle" className="color-warning" />
                </Tooltip>
            )}
            {isSystemFolderChild && !mergeWarning && (
                <Tooltip title={c('Tooltip').t`System subfolders will show up as separate folders in ${MAIL_APP_NAME}`}>
                    <Icon tabIndex={-1} name="info-circle" />
                </Tooltip>
            )}
        </div>
    ) : null;
};

export default ManageFoldersRowFolderErrors;
