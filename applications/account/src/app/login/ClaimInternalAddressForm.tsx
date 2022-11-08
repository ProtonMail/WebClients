import { c } from 'ttag';

import { Button, Card } from '@proton/atoms';
import { useLoading } from '@proton/components';
import { queryCheckUsernameAvailability } from '@proton/shared/lib/api/user';
import { Api } from '@proton/shared/lib/interfaces';
import noop from '@proton/utils/noop';

interface Props {
    domain: string;
    username: string;
    api: Api;
    onSubmit: (username: string, domain: string) => Promise<void>;
    onEdit: () => void;
}

const ClaimInternalAddressForm = ({ username = '', domain, api, onSubmit, onEdit }: Props) => {
    const [loading, withLoading] = useLoading();

    const handleSubmit = async () => {
        await api(queryCheckUsernameAvailability(`${username}@${domain}`, true));
        return onSubmit(username, domain);
    };

    // translator: Create your own (email address)
    const createYourOwn = c('Action').t`Create your own`;
    return (
        <div>
            <span className="text-semibold">{c('Info').t`The following address is available:`}</span>
            <Card className="mt0-5 mb1 text-center" bordered={false} rounded>{`${username}@${domain}`}</Card>
            <Button
                size="large"
                color="norm"
                onClick={() => {
                    if (loading) {
                        return;
                    }
                    withLoading(handleSubmit()).catch(noop);
                }}
                fullWidth
                loading={loading}
                className="mt1"
            >
                {c('Action').t`Claim it`}
            </Button>
            <Button
                size="large"
                color="norm"
                shape="outline"
                fullWidth
                onClick={loading ? undefined : onEdit}
                className="mt0-5"
            >
                {createYourOwn}
            </Button>
        </div>
    );
};

export default ClaimInternalAddressForm;
