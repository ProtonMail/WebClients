import { c } from 'ttag';

import { Copy } from '../../components';

export interface Props {
    amount: number;
    address: string;
}

const BitcoinDetails = ({ amount, address }: Props) => {
    return (
        <div>
            {amount ? (
                <>
                    <div className="flex flex-nowrap flex-align-items-center p-4 border-bottom">
                        <span className="flex-item-noshrink">{c('Label').t`BTC amount:`}</span>
                        <strong className="ml-1 mr-4 text-ellipsis" title={`${amount}`}>
                            {amount}
                        </strong>
                        <Copy value={`${amount}`} />
                    </div>
                </>
            ) : null}
            <div className="flex max-w100 flex-nowrap flex-align-items-center p-4 border-bottom">
                <span className="flex-item-noshrink">{c('Label').t`BTC address:`}</span>
                <strong className="ml-1 mr-4 text-ellipsis" title={address}>
                    {address}
                </strong>
                <Copy value={address} />
            </div>
        </div>
    );
};

export default BitcoinDetails;
