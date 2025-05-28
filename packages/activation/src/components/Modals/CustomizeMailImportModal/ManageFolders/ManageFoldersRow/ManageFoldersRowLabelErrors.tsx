import { EasyTrans } from '@proton/activation/src/helpers/easyTrans';
import { MailImportPayloadError } from '@proton/activation/src/interface';
import { Tooltip, TooltipTypeEnum } from '@proton/atoms';
import { Icon } from '@proton/components';

interface Props {
    checked: boolean;
    errors: MailImportPayloadError[];
}

const ManageFoldersRowLabelErrors = ({ checked, errors }: Props) => {
    const trans = EasyTrans.get(true);
    const tooLong = errors.includes(MailImportPayloadError.LABEL_NAMES_TOO_LONG);
    const alreadyUsed = errors.includes(MailImportPayloadError.UNAVAILABLE_NAMES);

    return checked ? (
        <div className="shrink-0 inline-flex self-center shrink-0 ml-4">
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
        </div>
    ) : null;
};

export default ManageFoldersRowLabelErrors;
