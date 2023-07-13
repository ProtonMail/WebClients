import { c } from 'ttag';

import { Button, Card } from '@proton/atoms';
import { useLoading } from '@proton/hooks';
import noop from '@proton/utils/noop';

interface Props {
    domain: string;
    username: string;
    onSubmit: (username: string, domain: string) => Promise<void>;
    onEdit?: () => void;
}

const ClaimInternalAddressForm = ({ username = '', domain, onSubmit, onEdit }: Props) => {
    const [loading, withLoading] = useLoading();

    // translator: Create your own (email address)
    const createYourOwn = c('Action').t`Create your own`;
    return (
        <div>
            <span className="text-semibold">{c('Info').t`The following address is available:`}</span>
            <Card
                data-testid="card:internal-address"
                className="mt-2 mb-4 text-center"
                bordered={false}
                rounded
            >{`${username}@${domain}`}</Card>
            <Button
                size="large"
                color="norm"
                onClick={() => {
                    if (loading) {
                        return;
                    }
                    withLoading(onSubmit(username, domain)).catch(noop);
                }}
                fullWidth
                loading={loading}
                className="mt-4"
            >
                {c('Action').t`Claim it`}
            </Button>
            {onEdit && (
                <Button
                    size="large"
                    color="norm"
                    shape="outline"
                    fullWidth
                    onClick={loading ? undefined : onEdit}
                    className="mt-2"
                >
                    {createYourOwn}
                </Button>
            )}
        </div>
    );
};

export default ClaimInternalAddressForm;
