import PropTypes from 'prop-types';
import { c, msgid } from 'ttag';
import humanSize from '@proton/shared/lib/helpers/humanSize';
import { Icon } from '../../components';

const MemberFeatures = ({ member }) => {
    const { UsedSpace, MaxSpace, MaxVPN } = member;

    const connectionsPluralized = `${c('Max VPN Connections').ngettext(msgid`Connection`, `Connections`, MaxVPN)}`;

    return (
        <>
            <span className="mb0-5 flex flex-nowrap">
                <span className="flex-item-noshrink flex mt0-1">
                    <Icon name="user-storage" />
                </span>
                <span className="flex-item-fluid pl0-25">
                    {humanSize(UsedSpace, 'GB')} / {humanSize(MaxSpace, 'GB')}
                </span>
            </span>
            <span className="flex flex-nowrap">
                <span className="flex-item-noshrink flex mt0-1">
                    <Icon name="protonvpn" />
                </span>
                <span className="flex-item-fluid pl0-25">
                    {MaxVPN} {c('Feature').t`VPN ${connectionsPluralized}`}
                </span>
            </span>
        </>
    );
};

MemberFeatures.propTypes = {
    member: PropTypes.object.isRequired,
};

export default MemberFeatures;
