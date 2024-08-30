import { c } from 'ttag';

import { ProtonLogo } from '@proton/components';
import illustration from '@proton/styles/assets/img/illustrations/account-call-confirmation-illustration.svg';

const CallScheduledPage = () => {
    return (
        <main className="max-w-custom mx-auto p-4 flex flex-column" style={{ '--max-w-custom': '30rem' }}>
            <ProtonLogo variant="full" className="mx-auto" />
            <div className="border rounded-xl mt-8 md:mt-16 p-4 py-8 md:p-11 flex flex-column gap-4 md:gap-6 items-center text-center">
                <img src={illustration} alt="" className="w-custom shrink-0" style={{ '--w-custom': '8rem' }} />
                <h1 className="m-0 text-bold text-4xl">{c('Call Scheduled Confirmation').t`Request sent`}</h1>
                <p className="m-0">
                    {c('Call Scheduled Confirmation').t`We'll get back to you with more information as soon as we can.`}
                </p>
                <p className="m-0">{c('Call Scheduled Confirmation').t`You can safely close this tab.`}</p>
            </div>
        </main>
    );
};

export default CallScheduledPage;
