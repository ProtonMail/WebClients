import { c } from 'ttag';

import { ProtonLogo } from '@proton/components/index';
import illustration from '@proton/styles/assets/img/illustrations/account-call-confirmation-illustration.svg';

const CallScheduledPage = () => {
    return (
        <main className="max-w-custom mx-auto p-4 flex flex-column" style={{ '--max-w-custom': '30rem' }}>
            <ProtonLogo variant="full" className="mx-auto" />
            <div className="border rounded-xl mt-8 md:mt-11 p-4 py-8 md:p-11 flex flex-column gap-4 md:gap-8 items-center text-center">
                <img src={illustration} alt="" className="w-custom shrink-0" style={{ '--w-custom': '8rem' }} />
                <h1 className="m-0 text-bold text-lg">{c('Call Scheduled Confirmation').t`You are scheduled`}</h1>
                <p className="m-0">{c('Call Scheduled Confirmation')
                    .t`A calendar invitation has been sent to your email address.`}</p>
                <p className="m-0">{c('Call Scheduled Confirmation').t`You can safely close this tab.`}</p>
            </div>
        </main>
    );
};

export default CallScheduledPage;
