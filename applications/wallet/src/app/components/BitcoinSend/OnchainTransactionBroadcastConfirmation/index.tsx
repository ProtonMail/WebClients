import { c } from 'ttag';

import Card from '@proton/atoms/Card/Card';
import Href from '@proton/atoms/Href/Href';
import Icon from '@proton/components/components/icon/Icon';

import { BLOCKCHAIN_EXPLORER_BASE_URL } from '../../../constants';

interface Props {
    txid: string;
}

export const OnchainTransactionBroadcastConfirmation = ({ txid }: Props) => {
    return (
        <Card
            className="flex flex-column transaction-builder-card bg-norm flex-1 overflow-y-auto flex-nowrap mx-4"
            bordered={false}
            background={false}
            rounded
        >
            <div className="m-auto flex flex-column py-14">
                <Icon name="checkmark-circle" className="color-success mb-4 mx-auto" size={56} />
                <span className="mx-auto text-semibold">{c('Wallet Send').t`Transaction broadcasted!`}</span>
                <Href
                    className="mx-auto color-hint text-sm mt-2 text-no-decoration"
                    href={`${BLOCKCHAIN_EXPLORER_BASE_URL}/${txid}`}
                    target="_blank"
                >
                    <span>{txid}</span>
                </Href>
            </div>
        </Card>
    );
};
