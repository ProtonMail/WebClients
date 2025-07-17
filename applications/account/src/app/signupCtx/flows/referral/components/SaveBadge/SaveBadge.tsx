import { getSavePercentageString } from '../../helpers/i18n';

export const SaveBadge = ({ savePercentage }: { savePercentage: number }) => {
    return (
        <span
            className="rounded-lg px-2 color-primary text-semibold fade-in"
            style={{ backgroundColor: 'rgb(109 74 255 / 0.08)' }}
        >
            {getSavePercentageString(savePercentage)}
        </span>
    );
};
