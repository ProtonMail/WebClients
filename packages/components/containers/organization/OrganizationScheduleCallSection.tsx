import { c } from 'ttag';

import { useGetScheduleCall } from '@proton/account/scheduleCall/hooks';
import { Button } from '@proton/atoms';
import { Href } from '@proton/atoms/Href';
import useLoading from '@proton/hooks/useLoading';
import { openCalendlyLink } from '@proton/shared/lib/helpers/support';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import illustration from '@proton/styles/assets/img/illustrations/account-support-phone.svg';

import { useUser } from '../../hooks';
import { SettingsSection } from '../account';

interface Props {
    onOpenChat?: () => void;
}

const OrganizationScheduleCallSection = ({ onOpenChat }: Props) => {
    const [user] = useUser();
    const [generatingCalendlyLink, withGeneratingCalendlyLink] = useLoading();
    const getScheduleCall = useGetScheduleCall();

    const handleScheduleCallClick = async () => {
        const { CalendlyLink } = await getScheduleCall();

        openCalendlyLink(CalendlyLink, user);
    };

    const boldPhoneCall = (
        <b key="bold-phone-call">{
            // translator: Full sentence is 'Request a phone call or Zoom meeting with one of our support specialists, ...'
            c('Info').t`Request a phone call`
        }</b>
    );

    const boldZoomMeeting = (
        <b key="bold-zoom-meeting">{
            // translator: Full sentence is 'Request a phone call or Zoom meeting with one of our support specialists, ...'
            c('Info').t`Zoom meeting`
        }</b>
    );

    const boldLiveChat = (
        <b key="bold-live-chat">{
            // translator: Request a phone call or Zoom meeting with one of our support specialists, or open a Live chat for chat support.'
            c('Info').t`Live chat`
        }</b>
    );

    return (
        <SettingsSection className="border rounded-lg p-4 lg:p-6 flex flex-column lg:flex-row items-center lg:items-start flex-nowrap text-center lg:text-left gap-4">
            <img src={illustration} alt="" className="w-custom shrink-0" style={{ '--w-custom': '3rem' }} />
            <div>
                <h2 className="text-lg text-bold mb-4">{c('Headline').t`Contact us`}</h2>
                <p className="mb-5">
                    {onOpenChat
                        ? // translator: Full sentence is 'If you’re having trouble, we’re here to help. Request a phone call or Zoom meeting with one of our support specialists, or open a Live chat for chat support.'
                          c('Info')
                              .jt`If you’re having trouble, we’re here to help. ${boldPhoneCall} or ${boldZoomMeeting} with one of our support specialists, or open a ${boldLiveChat} for chat support.`
                        : // translator: Full sentence is 'If you’re having trouble, we’re here to help. Request a phone call or Zoom meeting with one of our support specialists.'
                          c('Info')
                              .jt`If you’re having trouble, we’re here to help. ${boldPhoneCall} or ${boldZoomMeeting} with one of our support specialists.`}{' '}
                    <Href className="inline-block" href={getKnowledgeBaseUrl('/request-b2b-phone-support')}>
                        {c('Link').t`Learn more`}
                    </Href>
                </p>
                <div className="flex gap-4 justify-center lg:justify-start">
                    <Button
                        onClick={() => withGeneratingCalendlyLink(handleScheduleCallClick)}
                        color="norm"
                        shape="outline"
                        loading={generatingCalendlyLink}
                    >
                        {c('Action').t`Request a call`}
                    </Button>
                    {onOpenChat && (
                        <Button color="norm" shape="outline" onClick={onOpenChat}>
                            {c('Action').t`Start live chat`}
                        </Button>
                    )}
                </div>
            </div>
        </SettingsSection>
    );
};

export default OrganizationScheduleCallSection;
