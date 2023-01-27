import { EasyTrans } from '@proton/activation/helpers/easyTrans';
import { MailImportPayloadError } from '@proton/activation/interface';
import { Icon, Tooltip } from '@proton/components';

interface Props {
    checked: boolean;
    errors: MailImportPayloadError[];
}

const ManageFoldersRowLabelErrors = ({ checked, errors }: Props) => {
    const trans = EasyTrans.get(true);
    const tooLong = errors.includes(MailImportPayloadError.LABEL_NAMES_TOO_LONG);
    const alreadyUsed = errors.includes(MailImportPayloadError.UNAVAILABLE_NAMES);

    return checked ? (
        <div className="flex-item-noshrink inline-flex flex-align-self-center flex-item-noshrink ml1">
            {tooLong && (
                <Tooltip title={trans.errorNameTooLong()} type="error">
                    <Icon tabIndex={-1} name="info-circle" className="color-danger" />
                </Tooltip>
            )}

            {alreadyUsed && !tooLong && (
                <Tooltip title={trans.errorNameAlreadyExists()} type="error">
                    <Icon tabIndex={-1} name="info-circle" className="color-danger" />
                </Tooltip>
            )}
        </div>
    ) : null;
};

export default ManageFoldersRowLabelErrors;
