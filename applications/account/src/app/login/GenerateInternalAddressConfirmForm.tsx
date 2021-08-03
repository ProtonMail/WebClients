import { c } from 'ttag';
import { useLoading, Button } from '@proton/components';
import { noop } from '@proton/shared/lib/helpers/function';
import { BRAND_NAME } from '@proton/shared/lib/constants';

interface Props {
    onSubmit: () => Promise<void>;
    address: string;
    recoveryAddress: string;
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
            <div className="mb1-75">
                {c('Info')
                    .jt`${strongAddressAvailable} You will use this email address to sign into all ${BRAND_NAME} services.`}
            </div>
            <div className="p1 mb1-75 text-center bg-weak rounded">
                <div className="text-bold">{c('Info').t`Your recovery email address:`}</div>
                {recoveryAddress}
            </div>
            <Button size="large" color="norm" type="submit" fullWidth loading={loading} autoFocus className="mt1-75">
                {c('Action').t`Create address`}
            </Button>
        </form>
    );
};

export default GenerateInternalAddressConfirmForm;
