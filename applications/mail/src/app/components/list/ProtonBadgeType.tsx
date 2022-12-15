import VerifiedBadge from './VerifiedBadge';

export enum PROTON_BADGE_TYPE {
    VERIFIED,
}

interface Props {
    badgeType: PROTON_BADGE_TYPE;
    selected?: boolean;
}

const ProtonBadgeType = ({ badgeType, selected }: Props) => {
    if (badgeType === PROTON_BADGE_TYPE.VERIFIED) {
        return <VerifiedBadge selected={selected} />;
    }

    return null;
};

export default ProtonBadgeType;
