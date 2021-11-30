import { useEffect, useContext } from 'react';
import { c, msgid } from 'ttag';
import {
    Button,
    ButtonLike,
    ChecklistItem,
    Countdown,
    Icon,
    Progress,
    SettingsLink,
    useApi,
    Loader,
    classnames,
} from '@proton/components';
import { seenCompletedChecklist } from '@proton/shared/lib/api/checklist';
import { APPS } from '@proton/shared/lib/constants';
import isTruthy from '@proton/shared/lib/helpers/isTruthy';
import gift from '@proton/styles/assets/img/get-started/gift.svg';
import { GetStartedChecklistKey } from '@proton/shared/lib/interfaces';

import { GetStartedChecklistContext } from '../../containers/GetStartedChecklistProvider';
import './GetStartedChecklist.scss';

const totalGBStorageAfterCompletion = 1;

/*
 * This component is separated out so that a "seen" request can be sent
 * at the moment that it mounts. This wouldn't be possible if it was part
 * of the larger checklist component as it is only rendered conditionally,
 * mainly when the checklist is complete.
 */
const GetStartedChecklistComplete = () => {
    const api = useApi();

    useEffect(() => {
        api({ ...seenCompletedChecklist('get-started'), silence: true });
    }, []);

    return (
        <div className="p1 text-center">
            <img className="mb1-5 mt1-5" src={gift} width={48} />
            <p className="h3 mb0 text-bold">{c('Get started checklist completion').t`You're all set!`}</p>
            <p className="color-weak mt0-5 mb1-5">
                <span className="get-started_completion-text inline-block">
                    {c('Get started checklist completion')
                        .t`We've increased the total storage of your account to ${totalGBStorageAfterCompletion} GB. Get additional storage and unlock premium features today.`}
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
    hideDismissButton?: boolean;
    limitedMaxWidth?: boolean;
    onItemSelection: (key: GetStartedChecklistKey) => () => void;
    onDismiss?: () => void;
}

const GetStartedChecklist = ({
    hideDismissButton,
    limitedMaxWidth,
    onDismiss,
    onItemSelection,
}: GetStartedChecklistProps) => {
    const { expires, checklist, loading } = useContext(GetStartedChecklistContext);

    const checklistItems = [
        {
            key: GetStartedChecklistKey.Import,
            text: c('Get started checklist item').t`Import contacts or emails`,
            icon: 'arrow-down-to-screen',
        },
        {
            key: GetStartedChecklistKey.SendMessage,
            text: c('Get started checklist item').t`Send a message`,
            icon: 'paper-plane',
        },
        {
            key: GetStartedChecklistKey.RecoveryMethod,
            text: c('Get started checklist item').t`Set up a recovery method`,
            icon: 'lock',
        },
        {
            key: GetStartedChecklistKey.MobileApp,
            text: c('Get started checklist item').t`Get mobile app`,
            icon: 'mobile',
        },
    ]
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
        return <GetStartedChecklistComplete />;
    }

    const { length: totalNumberOfChecklistItems } = checklistItems;

    return (
        <div className={classnames(['p1', limitedMaxWidth && 'get-started_root--limited-width mauto'])}>
            <div className="flex flex-align-items-center flex-justify-space-between">
                <span className={classnames(['flex flex-align-items-center', hideDismissButton ? 'w100' : 'w80'])}>
                    <span className="get-started_gift mr1">
                        {/*
                         * if we don't put an empty alt attribute here, some vocalizers
                         * will vocalize the src attribute
                         */}
                        <img src={gift} alt="" />
                    </span>
                    <span className="flex-item-fluid text-bold text-ellipsis">
                        <span className="no-mobile">{c('Get started checklist title').t`Get started`}</span>
                        <span className="no-tablet no-desktop">{c('Get started checklist title').t`Get started`}</span>
                    </span>
                    <span className="flex-justify-end">
                        {c('Amount of completed get started checklist items')
                            .t`${numberOfCompletedItems} of ${totalNumberOfChecklistItems} complete`}
                    </span>
                </span>
                {!hideDismissButton && (
                    <div className="pl1">
                        <Button icon shape="ghost" onClick={onDismiss}>
                            <Icon name="xmark" size={12} alt={c('Action').t`Dismiss get started checklist`} />
                        </Button>
                    </div>
                )}
            </div>
            <div className={classnames(['ml0-5', hideDismissButton ? 'w100' : 'w80'])}>
                <Progress
                    className="progress-bar--success"
                    value={numberOfCompletedItems}
                    max={totalNumberOfChecklistItems}
                />
            </div>

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
                        .t`Complete all steps and get a total of ${totalGBStorageAfterCompletion} GB on your account`}
                </div>
            </div>
            <div>
                <Countdown
                    end={expires}
                    render={({ expired, days }) => (
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
                    )}
                />
            </div>
        </div>
    );
};

export default GetStartedChecklist;
