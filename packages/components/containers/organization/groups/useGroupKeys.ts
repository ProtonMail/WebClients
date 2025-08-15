import useGetPublicKeysForInbox from '@proton/components/hooks/useGetPublicKeysForInbox';
import useNotifications from '@proton/components/hooks/useNotifications';

const useGroupKeys = () => {
    const getPublicKeysForInbox = useGetPublicKeysForInbox();
    const { createNotification } = useNotifications();

    const getMemberPublicKeys = async (memberEmail: string) => {
        const memberPublicKeys = await getPublicKeysForInbox({
            email: memberEmail,
            lifetime: 0,
        });

        if (memberPublicKeys.Errors) {
            memberPublicKeys.Errors.forEach((error: string) => {
                createNotification({ text: error, type: 'error' });
            });
            throw new Error('Failed to get member public keys');
        }

        return memberPublicKeys;
    };

    return {
        getMemberPublicKeys,
    };
};

export default useGroupKeys;
