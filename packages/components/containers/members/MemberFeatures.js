import PropTypes from 'prop-types';
import { c, msgid } from 'ttag';
import humanSize from '@proton/shared/lib/helpers/humanSize';
import { Icon } from '../../components';

const MemberFeatures = ({ member }) => {
    const { UsedSpace, MaxSpace, MaxVPN } = member;

    return (
        <>
            <span className="mb0-5 flex flex-nowrap">
                <span className="flex-item-noshrink flex mt0-1">
                    <Icon name="filing-cabinet" />
                </span>
                <span className="flex-item-fluid pl0-25">
                    {humanSize(UsedSpace, 'GB')} / {humanSize(MaxSpace, 'GB')}
                </span>
            </span>
            <span className="flex flex-nowrap">
                <span className="flex-item-noshrink flex mt0-1">
                    <Icon name="brand-proton-vpn" />
                </span>
                <span className="flex-item-fluid pl0-25">
                    {c('Feature').ngettext(msgid`${MaxVPN} VPN connection`, `${MaxVPN} VPN connections`, MaxVPN)}
                </span>
            </span>
        </>
    );
};

MemberFeatures.propTypes = {
    member: PropTypes.object.isRequired,
};

export default MemberFeatures;
