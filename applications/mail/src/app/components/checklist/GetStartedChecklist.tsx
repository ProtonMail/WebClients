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
} from '@proton/components';
import { MnemonicPromptModal } from '@proton/components/containers/mnemonic';
import { diff } from '@proton/shared/lib/helpers/array';
import { getChecklist } from '@proton/shared/lib/api/checklist';
import { APPS, BRAND_NAME } from '@proton/shared/lib/constants';
import gift from '@proton/styles/assets/img/get-started/gift.svg';

import { getAppName } from '@proton/shared/lib/apps/helper';
import { MESSAGE_ACTIONS } from '../../constants';
import { useOnCompose } from '../../containers/ComposeProvider';
import ModalGetMobileApp from './ModalGetMobileApp';
import ModalImportContactsOrEmails from './ModalImportContactsOrEmails';
import './GetStartedChecklist.scss';

export enum ChecklistKey {
    SendMessage = 'SendMessage',
    MobileApp = 'MobileApp',
    RecoveryMethod = 'RecoveryMethod',
    Import = 'Import',
}

interface GetStartedChecklistProps {
    hideDismissButton?: boolean;
    onDismiss?: () => void;
}

const GetStartedChecklist = ({ hideDismissButton, onDismiss }: GetStartedChecklistProps) => {
    const [checklist, setChecklist] = useState<ChecklistKey[]>([]);
    const api = useApi();
    const [user] = useUser();
    const onCompose = useOnCompose();
    const { createModal } = useModals();
    const [loading, withLoading] = useLoading();

    const allChecklistItemsComplete = diff(Object.values(ChecklistKey), checklist).length === 0;

    useEffect(() => {
        withLoading(
            api<{ Items: ChecklistKey[] }>(getChecklist('get-started')).then(({ Items }) => setChecklist(Items))
        );
    }, []);

    const numberOfCompletedItems = checklist.length;

    if (loading) {
        return (
            <div className="p1">
                <Loader />
            </div>
        );
    }

    if (allChecklistItemsComplete) {
        const { hasPaidMail, hasPaidVpn, isFree } = user;
        const userIsFreeOrMailOnly = isFree || (hasPaidMail && !hasPaidVpn);
        const protonMailAppName = getAppName(APPS.PROTONMAIL);

        return (
            <div className="p1 text-center">
                <img className="mb1-5 mt1-5" src={gift} width={48} />
                <p className="h3 mb0 text-bold">{c('Get started checklist completion').t`You're a privacy champ!`}</p>
                <p className="color-weak mt0-5 mb1-5">
                    <span className="get-started_completion-text">
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
    }

    const checklistItems = [
        {
            key: ChecklistKey.SendMessage,
            text: c('Get started checklist item').t`Send a message`,
            icon: 'paper-plane',
            onClick: () => {
                onCompose({ action: MESSAGE_ACTIONS.NEW });
            },
        },
        {
            key: ChecklistKey.MobileApp,
            text: c('Get started checklist item').t`Get mobile app`,
            icon: 'mobile',
            onClick: () => {
                createModal(<ModalGetMobileApp />);
            },
        },
        {
            key: ChecklistKey.RecoveryMethod,
            text: c('Get started checklist item').t`Activate your recovery phrase`,
            icon: 'lock',
            onClick: () => {
                createModal(<MnemonicPromptModal />);
            },
        },
        {
            key: ChecklistKey.Import,
            text: c('Get started checklist item').t`Import contacts or emails`,
            icon: 'arrow-down-to-screen',
            onClick: () => {
                createModal(<ModalImportContactsOrEmails />);
            },
        },
    ]
        .map(({ key, ...rest }) => ({
            key,
            complete: checklist.includes(key),
            ...rest,
        }))
        .sort(({ complete: completeA }, { complete: completeB }) => Number(completeA) - Number(completeB))
        .map(({ key, text, icon, onClick }) => (
            <ChecklistItem key={key} text={text} icon={icon} complete={checklist.includes(key)} onClick={onClick} />
        ));

    const { length: totalNumberOfChecklistItems } = Object.keys(ChecklistKey);

    return (
        <div className="p1">
            <div className="flex flex-align-items-center">
                <div className="flex-item-fluid">
                    <div className="flex">
                        <span className="mr1">
                            <img src={gift} />
                        </span>
                        <span className="flex-item-fluid text-bold">
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
                    </div>
                    <Progress value={numberOfCompletedItems} max={totalNumberOfChecklistItems} />
                </div>
                {!hideDismissButton && (
                    <div className="pl1">
                        <Button icon shape="ghost" onClick={onDismiss}>
                            <Icon name="xmark" size={12} />
                        </Button>
                    </div>
                )}
            </div>

            <div>
                <ul className="unstyled">{checklistItems}</ul>
            </div>

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
