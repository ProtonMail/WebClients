import { useState } from 'react';

import { c } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import { Button } from '@proton/atoms/Button/Button';
import { ButtonLike } from '@proton/atoms/Button/ButtonLike';
import { Href } from '@proton/atoms/Href/Href';
import { IcCross } from '@proton/icons/icons/IcCross';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import adminConsoleSurveyIllustration from '@proton/styles/assets/img/illustrations/admin-console-survey.svg';
import clsx from '@proton/utils/clsx';

import useLocalState from '../../../hooks/useLocalState';

import './AdminConsoleSurveyCard.scss';

const ADMIN_CONSOLE_SURVEY_URL =
    'https://participant.use2.usertesting.com/se/invite/155c98df-30f7-4b6d-a139-8968813d4546';

const AdminConsoleSurveyCard = () => {
    const [user] = useUser();
    const [dismissed, setDismissed] = useLocalState(false, `${user.ID}-admin-console-survey-dismissed`);

    const [closing, setClosing] = useState(false);

    if (dismissed) {
        return null;
    }

    const handleDismiss = () => setClosing(true);

    return (
        <div
            className={clsx(
                'admin-console-survey-card fixed bottom-0 end-0 m-6 z-up w-custom max-w-custom hidden md:flex flex-nowrap gap-6 p-6 bg-norm shadow-lifted rounded-xxl',
                closing && 'admin-console-survey-card--closing pointer-events-none'
            )}
            style={{ '--w-custom': '42rem', '--max-w-custom': 'calc(100vw - 3rem)' }}
            onAnimationEnd={(e) => {
                if (closing && e.target === e.currentTarget) {
                    setDismissed(true);
                }
            }}
        >
            <img
                src={adminConsoleSurveyIllustration}
                alt=""
                width={164}
                height={164}
                className="admin-console-survey-card-illustration shrink-0"
            />
            <div className="admin-console-survey-card-content flex flex-column gap-2 flex-1">
                <div className="flex flex-nowrap items-start gap-2">
                    <h2 className="text-bold text-xl flex-1 m-0 py-1">{c('Title')
                        .t`Help shape ${BRAND_NAME}'s admin experience`}</h2>
                    <Button icon shape="ghost" onClick={handleDismiss} title={c('Action').t`Close`}>
                        <IcCross alt={c('Action').t`Close`} />
                    </Button>
                </div>
                <p className="m-0">{c('Info')
                    .t`We're building a new way for you to manage your organization, and we're looking for specific users to join a video call and try an early version. Curious if you'd be a good match? Answer a few quick questions to see if you can participate.`}</p>
                <div className="flex gap-2 pt-3">
                    <ButtonLike as={Href} color="norm" href={ADMIN_CONSOLE_SURVEY_URL}>
                        {c('Action').t`Take the survey`}
                    </ButtonLike>
                    <Button onClick={handleDismiss}>{c('Action').t`Not now`}</Button>
                </div>
            </div>
        </div>
    );
};

export default AdminConsoleSurveyCard;
