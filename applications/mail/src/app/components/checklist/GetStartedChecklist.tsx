import { useEffect } from 'react';

import { c, msgid } from 'ttag';

import { ButtonLike, ChecklistItem, Loader, SettingsLink, classnames, useApi } from '@proton/components';
import { useDateCountdown } from '@proton/hooks';
import { seenCompletedChecklist } from '@proton/shared/lib/api/checklist';
import { APPS } from '@proton/shared/lib/constants';
import { ChecklistKey } from '@proton/shared/lib/interfaces';
import gift from '@proton/styles/assets/img/illustrations/gift.svg';
import isTruthy from '@proton/utils/isTruthy';

import { useGetStartedChecklist } from '../../containers/checklists';
import GetStartedChecklistHeader from './GetStartedChecklistHeader';

import './GetStartedChecklist.scss';

/*
 * This component is separated out so that a "seen" request can be sent
 * at the moment that it mounts. This wouldn't be possible if it was part
 * of the larger checklist component as it is only rendered conditionally,
 * mainly when the checklist is complete.
 */
const GetStartedChecklistComplete = ({ rewardInGb }: { rewardInGb: number }) => {
    const api = useApi();

    useEffect(() => {
        void api({ ...seenCompletedChecklist('get-started'), silence: true });
    }, []);

    return (
        <div className="p1 text-center">
            <img className="mb1-5 mt1-5" src={gift} width={48} />
            <p className="h3 mb0 text-bold">{c('Get started checklist completion').t`You're all set!`}</p>
            <p className="color-weak mt0-5 mb1-5">
                <span className="get-started_completion-text inline-block">
                    {c('Get started checklist completion')
                        .t`We've increased the total storage of your account to ${rewardInGb} GB. Get additional storage and unlock premium features today.`}
                </span>
            </p>
            <ButtonLike
                className="inline-flex flex-align-items-center"
                shape="outline"
                as={SettingsLink}
                app={APPS.PROTONMAIL}
                path="/"
            >
                {c('Action').t`Upgrade now`}
            </ButtonLike>
        </div>
    );
};

interface GetStartedChecklistProps {
    limitedMaxWidth?: boolean;
    onItemSelection: (key: ChecklistKey) => () => void;
    onDismiss?: () => void;
}

const GetStartedChecklist = ({ limitedMaxWidth, onDismiss, onItemSelection }: GetStartedChecklistProps) => {
    const { expires, checklist, loading, rewardInGb } = useGetStartedChecklist();
    const { expired, days } = useDateCountdown(expires);

    const checklistItems = (
        [
            {
                key: ChecklistKey.Import,
                text: c('Get started checklist item').t`Import contacts or emails`,
                icon: 'arrow-down-to-square',
            },
            {
                key: ChecklistKey.SendMessage,
                text: c('Get started checklist item').t`Send a message`,
                icon: 'paper-plane',
            },
            {
                key: ChecklistKey.RecoveryMethod,
                text: c('Get started checklist item').t`Set up a recovery method`,
                icon: 'lock',
            },
            {
                key: ChecklistKey.MobileApp,
                text: c('Get started checklist item').t`Get mobile app`,
                icon: 'mobile',
            },
        ] as const
    )
        .filter(isTruthy)
        .map(({ key, ...rest }) => ({
            key,
            complete: checklist.includes(key),
            onClick: onItemSelection(key),
            ...rest,
        }));

    const numberOfCompletedItems = checklist.length;

    if (loading) {
        return (
            <div className="p1 mauto">
                <Loader />
            </div>
        );
    }

    if (checklistItems.every(({ complete }) => complete)) {
        return <GetStartedChecklistComplete rewardInGb={rewardInGb} />;
    }

    const { length: totalNumberOfItems } = checklistItems;

    return (
        <div className={classnames(['p1', limitedMaxWidth && 'get-started_root--limited-width mauto'])}>
            <GetStartedChecklistHeader
                numberOfCompletedItems={numberOfCompletedItems}
                totalNumberOfItems={totalNumberOfItems}
                onDismiss={onDismiss}
            />

            <ul className="unstyled ml0-5">
                {checklistItems
                    .sort(({ complete: completeA }, { complete: completeB }) => Number(completeA) - Number(completeB))
                    .map(({ key, text, icon, onClick }) => (
                        <ChecklistItem
                            key={key}
                            text={text}
                            icon={icon}
                            complete={checklist.includes(key)}
                            onClick={onClick}
                        />
                    ))}
            </ul>

            <hr />

            <div className="flex">
                <div className="text-bold">
                    {c('Get started checklist incentive')
                        .t`Complete all steps and get a total of ${rewardInGb} GB on your account`}
                </div>
            </div>
            <div>
                <div className="color-weak">
                    {(() => {
                        if (expired) {
                            return c('Get started checklist incentive').t`Expires soon`;
                        }

                        if (days > 0) {
                            return c('Get started checklist incentive').ngettext(
                                msgid`Only ${days} day left`,
                                `Only ${days} days left`,
                                days
                            );
                        }

                        return c('Get started checklist incentive').t`Expires today`;
                    })()}
                </div>
            </div>
        </div>
    );
};

export default GetStartedChecklist;
