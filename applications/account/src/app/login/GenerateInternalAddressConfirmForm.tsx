import { c } from 'ttag';
import { useLoading, Button } from '@proton/components';
import noop from '@proton/util/noop';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import Text from '../public/Text';

interface Props {
    onSubmit: () => Promise<void>;
    address: string;
    recoveryAddress?: string;
}

const GenerateInternalAddressConfirmForm = ({ onSubmit, address, recoveryAddress }: Props) => {
    const [loading, withLoading] = useLoading();

    const strongAddressAvailable = <strong key="address">{c('Action').t`${address} is available.`}</strong>;

    return (
        <form
            name="addressConfirmForm"
            onSubmit={(event) => {
                event.preventDefault();
                if (loading) {
                    return;
                }
                withLoading(onSubmit()).catch(noop);
            }}
            method="post"
        >
            <Text>
                {c('Info')
                    .jt`${strongAddressAvailable} You will use this email address to sign into all ${BRAND_NAME} services.`}
            </Text>
            {recoveryAddress && (
                <div className="p1 mb1-75 text-center bg-weak rounded text-break">
                    <div className="text-bold">{c('Info').t`Your recovery email address:`}</div>
                    {recoveryAddress}
                </div>
            )}
            <Button size="large" color="norm" type="submit" fullWidth loading={loading} autoFocus className="mt1-75">
                {c('Action').t`Create address`}
            </Button>
        </form>
    );
};

export default GenerateInternalAddressConfirmForm;
