import { c } from 'ttag';

import { Icon } from '@proton/components/components';
import { getInitials } from '@proton/shared/lib/helpers/string';

import { CoreButton } from '../../atoms';
import { MapItem } from '../EmailOrBitcoinAddressInput/useEmailAndBtcAddressesMaps';

interface BaseProps {
    onClickEdit?: () => void;
}

type Props = BaseProps & ({ recipients: MapItem[] } | { recipient: MapItem });

export const RecipientListItem = (props: Props) => {
    const [leftNode, name, address] =
        'recipients' in props
            ? [
                  <Icon name="users" />,
                  c('Wallet send').t`${props.recipients.length} recipients`,
                  props.recipients.map(({ recipient }) => recipient.Address).join(', '),
              ]
            : [
                  getInitials(props.recipient.recipient.Name ?? props.recipient.recipient.Address),
                  props.recipient.recipient.Name,
                  props.recipient.recipient.Address,
              ];

    return (
        <div className="flex flex-row flex-nowrap items-center grow px-2 py-3 rounded-lg mt-3 border w-full">
            <div
                className="ui-orange rounded-full w-custom h-custom mr-4 flex items-center justify-center text-lg text-semibold no-shrink"
                style={{
                    '--h-custom': '2.5rem',
                    '--w-custom': '2.5rem',
                    background: 'var(--interaction-norm-minor-1)',
                    color: 'var(--interaction-norm)',
                }}
            >
                {leftNode}
            </div>

            <div className="flex flex-column justify-center mr-auto">
                <span className="block w-full text-ellipsis text-left text">{name}</span>
                <span className="block w-full text-ellipsis text-left color-hint text-lg">{address}</span>
            </div>

            {props.onClickEdit && (
                <CoreButton
                    className="no-shrink ml-1"
                    size="small"
                    shape="ghost"
                    color="norm"
                    onClick={() => props.onClickEdit?.()}
                >
                    {c('Wallet send').t`Edit`}
                </CoreButton>
            )}
        </div>
    );
};
