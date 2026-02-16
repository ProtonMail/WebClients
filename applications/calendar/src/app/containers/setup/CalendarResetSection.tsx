import { useState } from 'react';

import { c } from 'ttag';

import { Href } from '@proton/atoms/Href/Href';
import CalendarSelectIcon from '@proton/components/components/calendarSelect/CalendarSelectIcon';
import Collapsible from '@proton/components/components/collapsible/Collapsible';
import CollapsibleContent from '@proton/components/components/collapsible/CollapsibleContent';
import CollapsibleHeader from '@proton/components/components/collapsible/CollapsibleHeader';
import CollapsibleHeaderIconButton from '@proton/components/components/collapsible/CollapsibleHeaderIconButton';
import { IcChevronDown } from '@proton/icons/icons/IcChevronDown';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import type { VisualCalendar } from '@proton/shared/lib/interfaces/calendar';
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
                <div key={ID} className="flex flex-nowrap w-full items-center mb-2">
                    <span className="flex shrink-0">
                        <CalendarSelectIcon color={Color} className="mr-2" />
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
                                    <IcChevronDown />
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
            <div className="flex w-full">
                <img src={encryptedEventSvg} alt={altText} className="m-auto" />
            </div>
            <p>
                {c('Info; reset calendar keys modal; part 2')
                    .t`This is because your password was recently reset without using a recovery method.`}
            </p>
            <p>
                {c('Info; reset calendar keys modal; part 3')
                    .t`You can recover your encrypted data with a recovery file, recovery phrase, or your old password.`}
            </p>
            <p className="mb-2">
                <Href href={getKnowledgeBaseUrl('/set-account-recovery-methods')}>
                    {c('Link; reset calendar keys modal').t`What's a recovery method?`}
                </Href>
            </p>
        </>
    );
};

export default CalendarResetSection;
