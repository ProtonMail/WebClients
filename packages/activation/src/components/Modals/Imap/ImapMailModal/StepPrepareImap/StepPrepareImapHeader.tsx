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
            <div className="flex pb-4 mb-4 border-bottom">
                <div className="flex-1 text-ellipsis mr-2">{c('Label; import email').jt`From: ${from}`}</div>
                <div className="flex-1 text-ellipsis ml-2 text-right">{c('Label; import email').jt`To: ${to}`}</div>
            </div>
        </>
    );
};

export default StepPrepareHeader;
