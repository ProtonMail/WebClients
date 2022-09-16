import { c } from 'ttag';

import { useUser } from '@proton/components';
import { isPaid } from '@proton/shared/lib/user/helpers';

const useEncryptedSearchItem = (bodyContentExists: boolean) => {
    const [user] = useUser();

    const showContentLabel = !isPaid(user) && !!bodyContentExists;
    const contentLabel = (
        <span className="text-italic">
            {
                // translator: the word "content" refers to the body of messages and is shown to remark that the following text comes from searching it
                c('Info').t`Content: `
            }
        </span>
    );

    return { showContentLabel, contentLabel };
};

export default useEncryptedSearchItem;
