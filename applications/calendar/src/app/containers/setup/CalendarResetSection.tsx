import { useState } from 'react';

import { c } from 'ttag';

import {
    Collapsible,
    CollapsibleContent,
    CollapsibleHeader,
    CollapsibleHeaderIconButton,
    Href,
    Icon,
} from '@proton/components';
import CalendarSelectIcon from '@proton/components/components/calendarSelect/CalendarSelectIcon';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import { VisualCalendar } from '@proton/shared/lib/interfaces/calendar';
import encryptedEventSvg from '@proton/styles/assets/img/illustrations/encrypted-event.svg';

const getFirstParagraphText = (resetAll: boolean) => {
    if (resetAll) {
        return c('Info; reset calendar keys modal; part 1')
            .t`Your calendars will not show details of previously created events.`;
    }
    return c('Info; reset calendar keys modal; part 1')
        .t`Some of your calendars will not show details of previously created events.`;
};

interface Props {
    calendarsToReset: VisualCalendar[];
    resetAll: boolean;
}
const CalendarResetSection = ({ calendarsToReset = [], resetAll }: Props) => {
    const altText = c('Title').t`Encrypted event`;

    const [show, setShow] = useState(false);
    const clickShow = () => setShow((show) => !show);

    const calendarsList = (
        <div>
            {calendarsToReset.map(({ ID, Name, Color }) => (
                <div key={ID} className="flex flex-nowrap w100 flex-align-items-center mb0-5">
                    <span className="flex flex-item-noshrink">
                        <CalendarSelectIcon color={Color} className="mr0-5" />
                    </span>
                    <span className="text-ellipsis" title={Name}>
                        {Name}
                    </span>
                </div>
            ))}
        </div>
    );

    return (
        <>
            <p>{getFirstParagraphText(resetAll)}</p>
            {!resetAll && (
                <div>
                    <Collapsible>
                        <CollapsibleHeader
                            suffix={
                                <CollapsibleHeaderIconButton onClick={clickShow}>
                                    <Icon name="chevron-down" />
                                </CollapsibleHeaderIconButton>
                            }
                            disableFullWidth
                            onClick={clickShow}
                        >
                            {show ? c('Action').t`Hide affected calendars` : c('Action').t`Show affected calendars`}
                        </CollapsibleHeader>
                        <CollapsibleContent>{calendarsList}</CollapsibleContent>
                    </Collapsible>
                </div>
            )}
            <div className="flex w100">
                <img src={encryptedEventSvg} alt={altText} className="mauto" />
            </div>
            <p>
                {c('Info; reset calendar keys modal; part 2')
                    .t`This is because your password was recently reset without using a recovery method.`}
            </p>
            <p>
                {c('Info; reset calendar keys modal; part 3')
                    .t`You can recover your encrypted data with a recovery file, recovery phrase, or your old password.`}
            </p>
            <p className="mb0-5">
                <Href url={getKnowledgeBaseUrl('/set-account-recovery-methods')}>
                    {c('Link; reset calendar keys modal').t`What's a recovery method?`}
                </Href>
            </p>
        </>
    );
};

export default CalendarResetSection;
