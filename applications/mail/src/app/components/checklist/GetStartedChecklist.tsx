import { useState, useEffect } from 'react';
import { c } from 'ttag';
import {
    Button,
    ButtonLike,
    ChecklistItem,
    Icon,
    Progress,
    SettingsLink,
    useModals,
    useApi,
    useLoading,
    Loader,
    useUser,
    useIsMnemonicAvailable,
    classnames,
    useEventManager,
} from '@proton/components';
import { MnemonicPromptModal } from '@proton/components/containers/mnemonic';
import { getChecklist, seenCompletedChecklist } from '@proton/shared/lib/api/checklist';
import { APPS, BRAND_NAME } from '@proton/shared/lib/constants';
import isTruthy from '@proton/shared/lib/helpers/isTruthy';
import { getAppName } from '@proton/shared/lib/apps/helper';
import gift from '@proton/styles/assets/img/get-started/gift.svg';
import { GetStartedChecklistKey } from '@proton/shared/lib/interfaces';

import { Event } from '../../models/event';
import ModalGetMobileApp from './ModalGetMobileApp';
import ModalImportEmails from './ModalImportEmails';
import './GetStartedChecklist.scss';

/*
 * This component is separated out so that a "seen" request can be sent
 * at the moment that it mounts. This wouldn't be possible if it was part
 * of the larger checklist component as it is only rendered conditionally,
 * mainly when the checklist is complete.
 */
const GetStartedChecklistComplete = ({ userIsFreeOrMailOnly }: { userIsFreeOrMailOnly: boolean }) => {
    const api = useApi();

    const protonMailAppName = getAppName(APPS.PROTONMAIL);

    useEffect(() => {
        api({ ...seenCompletedChecklist('get-started'), silence: true });
    }, []);

    return (
        <div className="p1 text-center">
            <img className="mb1-5 mt1-5" src={gift} width={48} />
            <p className="h3 mb0 text-bold">{c('Get started checklist completion').t`You're a privacy champ!`}</p>
            <p className="color-weak mt0-5 mb1-5">
                <span className="get-started_completion-text inline-block">
                    {!userIsFreeOrMailOnly
                        ? c('Get started checklist completion')
                              .t`We've added 1 GB of bonus storage to your account. For even more storage and premium features, upgrade your plan.`
                        : c('Get started checklist completion')
                              .t`We've added 1 GB of bonus storage to your account. Continue to explore ${BRAND_NAME} and share your ${protonMailAppName} address with your family, friends, and colleagues.`}
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
    onSendMessage: () => void;
    onDismiss?: () => void;
}

const GetStartedChecklist = ({
    hideDismissButton,
    limitedMaxWidth,
    onDismiss,
    onSendMessage,
}: GetStartedChecklistProps) => {
    const [checklist, setChecklist] = useState<GetStartedChecklistKey[]>([]);
    const api = useApi();
    const [user] = useUser();
    const { subscribe } = useEventManager();
    const { createModal } = useModals();
    const [loading, withLoading] = useLoading();
    const isMnemonicAvailable = useIsMnemonicAvailable();

    useEffect(() => {
        subscribe(({ ChecklistEvents }: Event) => {
            ChecklistEvents?.forEach(({ CompletedItem }) => {
                setChecklist((current) => [...current, CompletedItem]);
            });
        });
    }, []);

    const checklistItems = [
        {
            key: GetStartedChecklistKey.SendMessage,
            text: c('Get started checklist item').t`Send a message`,
            icon: 'paper-plane',
            onClick: () => {
                onSendMessage();
            },
        },
        {
            key: GetStartedChecklistKey.MobileApp,
            text: c('Get started checklist item').t`Get mobile app`,
            icon: 'mobile',
            onClick: () => {
                createModal(<ModalGetMobileApp />);
            },
        },
        isMnemonicAvailable && {
            key: GetStartedChecklistKey.RecoveryMethod,
            text: c('Get started checklist item').t`Activate your recovery phrase`,
            icon: 'lock',
            onClick: () => {
                createModal(<MnemonicPromptModal />);
            },
        },
        {
            key: GetStartedChecklistKey.Import,
            text: c('Get started checklist item').t`Import emails`,
            icon: 'arrow-down-to-screen',
            onClick: () => {
                createModal(<ModalImportEmails />);
            },
        },
    ]
        .filter(isTruthy)
        .map(({ key, ...rest }) => ({
            key,
            complete: checklist.includes(key),
            ...rest,
        }));

    useEffect(() => {
        withLoading(
            api<{ Items: GetStartedChecklistKey[] }>(getChecklist('get-started')).then(({ Items }) =>
                setChecklist(Items)
            )
        );
    }, []);

    const numberOfCompletedItems = checklist.length;

    if (loading) {
        return (
            <div className="p1 mauto">
                <Loader />
            </div>
        );
    }

    if (checklistItems.every(({ complete }) => complete)) {
        const { hasPaidMail, hasPaidVpn, isFree } = user;

        return <GetStartedChecklistComplete userIsFreeOrMailOnly={isFree || (hasPaidMail && !hasPaidVpn)} />;
    }

    const { length: totalNumberOfChecklistItems } = checklistItems;

    return (
        <div className={classnames(['p1', limitedMaxWidth && 'get-started_root--limited-width mauto'])}>
            <div className="flex flex-align-items-center flex-justify-space-between">
                <span className="flex flex-align-items-center w80">
                    <span className="get-started_gift mr1">
                        {/*
                         * if we don't put an empty alt attribute here, some vocalizers
                         * will vocalize the src attribute
                         */}
                        <img src={gift} alt="" />
                    </span>
                    <span className="flex-item-fluid text-bold text-ellipsis">
                        {
                            /*
                             * translator: BRAND_NAME refers to the name of our brand
                             * e.g. "Get started with Proton"
                             */
                            c('Get started checklist title').t`Get started with ${BRAND_NAME}`
                        }
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
            <div className="w80 ml0-5">
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
                    {c('Get started checklist incentive').t`Get 1 GB of extra storage by completing all steps`}
                </div>
            </div>
            <div>
                <div className="color-weak">{c('Get started checklist incentive').t`Only 28 days left`}</div>
            </div>
        </div>
    );
};

export default GetStartedChecklist;
