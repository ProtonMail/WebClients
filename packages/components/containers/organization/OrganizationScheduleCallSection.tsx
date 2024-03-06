import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { Href } from '@proton/atoms/Href';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import illustration from '@proton/styles/assets/img/illustrations/account-support-phone.svg';

import { useUser } from '../..';
import { SettingsSection } from '../account';
import { useCanEnableChat } from '../zendesk/LiveChatZendesk';

interface Props {
    onOpenChat?: () => void;
}

const OrganizationScheduleCallSection = ({ onOpenChat }: Props) => {
    const [user] = useUser();
    const canEnableChat = useCanEnableChat(user) && onOpenChat;

    const boldPhoneCall = (
        <b key="imperative-bold-text">{
            // translator: Full sentence is 'Schedule a phone call (or Zoom meet) with one of our support specialists, ...'
            c('Info').t`Schedule a phone call`
        }</b>
    );

    const boldLiveChat = (
        <b key="imperative-bold-text">{
            // translator: Schedule a phone call (or Zoom meet) with one of our support specialists, or open a Live chat for chat support'
            c('Info').t`Live chat`
        }</b>
    );

    return (
        <SettingsSection className="border rounded-lg p-4 lg:p-6 flex flex-column lg:flex-row items-center lg:items-start flex-nowrap text-center lg:text-left gap-4">
            <img src={illustration} alt="" className="w-custom shrink-0" style={{ '--w-custom': '3rem' }} />
            <div>
                <h2 className="text-lg text-bold mb-4">{c('Headline').t`Contact us`}</h2>
                <p className="mb-5">
                    {canEnableChat
                        ? c('Info')
                              .jt`If you’re having trouble, we’re here to help. ${boldPhoneCall} (or Zoom meet) with one of our support specialists, or open a ${boldLiveChat} for chat support.`
                        : c('Info')
                              .jt`If you’re having trouble, we’re here to help. ${boldPhoneCall} (or Zoom meet) with one of our support specialists.`}{' '}
                    <Href href={getKnowledgeBaseUrl('/')}>{c('Link').t`Learn more`}</Href>
                </p>
                <div className="flex gap-4 justify-center lg:justify-start">
                    <Button color="norm" shape="solid">{c('Action').t`Schedule a call`}</Button>
                    {canEnableChat && (
                        <Button
                            color="norm"
                            shape="outline"
                            onClick={() => {
                                onOpenChat();
                            }}
                        >{c('Action').t`Chat with us`}</Button>
                    )}
                </div>
            </div>
        </SettingsSection>
    );
};

export default OrganizationScheduleCallSection;
