import { classnames, Icon } from '@proton/components';
import { c, msgid } from 'ttag';

interface Props {
    numberOfTrackers: number;
    needsMoreProtection: boolean;
    title: string;
    className?: string;
    isDetails?: boolean;
}

const SpyTrackerIcon = ({ numberOfTrackers, needsMoreProtection, title, className, isDetails = false }: Props) => {
    return (
        <>
            <Icon
                name="shield"
                size={isDetails ? 16 : 14}
                alt={title}
                data-testid="privacy:tracker-icon"
                className={classnames([
                    needsMoreProtection && numberOfTrackers === 0 ? 'color-weak' : 'color-primary',
                    className,
                ])}
            />
            {numberOfTrackers > 0 ? (
                <span
                    className={classnames([
                        'item-spy-tracker-icon-bubble bg-primary rounded50 absolute text-center text-sm m0 lh130',
                        numberOfTrackers > 9 && 'item-spy-tracker-icon-bubble--9plus',
                    ])}
                    data-testid="privacy:icon-number-of-trackers"
                    aria-label={c('Info').ngettext(
                        msgid`${numberOfTrackers} email tracker blocked`,
                        `${numberOfTrackers} email trackers blocked`,
                        numberOfTrackers
                    )}
                >
                    {numberOfTrackers > 9 ? '9+' : numberOfTrackers}
                </span>
            ) : null}
        </>
    );
};

export default SpyTrackerIcon;
