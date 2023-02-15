import { c } from 'ttag';

import { BRAND_NAME } from '@proton/shared/lib/constants';

interface Props {
    fromEmail: string;
    toEmail: string;
}

const StepPrepareHeader = ({ fromEmail, toEmail }: Props) => {
    const from = <strong key="importedEmailAddress">{fromEmail}</strong>;
    const to = <strong key="PMEmailAddress">{toEmail}</strong>;

    return (
        <>
            <div>
                {c('Warning')
                    .t`${BRAND_NAME} will transfer as much data as possible, starting with your most recent messages.`}
            </div>
            <div className="flex pb1 mb1 border-bottom">
                <div className="flex-item-fluid text-ellipsis mr0-5">{c('Label').jt`From: ${from}`}</div>
                <div className="flex-item-fluid text-ellipsis ml0-5 text-right">{c('Label').jt`To: ${to}`}</div>
            </div>
        </>
    );
};

export default StepPrepareHeader;
