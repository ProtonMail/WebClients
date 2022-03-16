import { c, msgid } from 'ttag';

import { Button, Icon, Progress, classnames } from '@proton/components';
import gift from '@proton/styles/assets/img/get-started/gift.svg';

interface GetStartedChecklistHeaderInterface {
    numberOfCompletedItems: number;
    totalNumberOfItems: number;
    onDismiss?: () => void;
}

const GetStartedChecklistHeader = ({
    numberOfCompletedItems,
    totalNumberOfItems,
    onDismiss,
}: GetStartedChecklistHeaderInterface) => {
    return (
        <div>
            <div className="flex flex-align-items-center flex-justify-space-between">
                <span className={classnames(['flex flex-align-items-center', !onDismiss ? 'w100' : 'w80'])}>
                    <span className="get-started_gift mr1">
                        {/*
                         * if we don't put an empty alt attribute here, some vocalizers
                         * will vocalize the src attribute
                         */}
                        <img src={gift} alt="" />
                    </span>
                    <span className="flex-item-fluid text-bold text-ellipsis">
                        {c('Get started checklist title').t`Get started`}
                    </span>
                    <span className="flex-justify-end">
                        {
                            // Translator: 1/4 complete
                            c('Amount of completed get started checklist items').ngettext(
                                msgid`${numberOfCompletedItems}/${totalNumberOfItems} complete`,
                                `${numberOfCompletedItems}/${totalNumberOfItems} complete`,
                                numberOfCompletedItems
                            )
                        }
                    </span>
                </span>
                {onDismiss && (
                    <div className="pl1">
                        <Button icon shape="ghost" onClick={onDismiss}>
                            <Icon name="xmark" size={12} alt={c('Action').t`Dismiss get started checklist`} />
                        </Button>
                    </div>
                )}
            </div>

            <div className={classnames(['ml0-5', !onDismiss ? 'w100' : 'w80'])}>
                <Progress className="progress-bar--success" value={numberOfCompletedItems} max={totalNumberOfItems} />
            </div>
        </div>
    );
};

export default GetStartedChecklistHeader;
