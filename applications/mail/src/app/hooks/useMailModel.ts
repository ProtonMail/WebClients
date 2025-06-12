import { useMailSettings } from '@proton/mail/store/mailSettings/hooks';

type MailModel = 'MailSettings';

const useMailModel = (key: MailModel) => {
    const [mailSettings] = useMailSettings();

    if (key === 'MailSettings' && mailSettings) {
        return mailSettings;
    }

    throw new Error(`Model ${key} does not exist`);
};

export default useMailModel;
