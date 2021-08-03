import { memo } from 'react';

interface Props {
    days: Date[];
}
const DayLines = ({ days }: Props) => {
    return (
        <div className="flex">
            {days.map((day) => {
                return <div className="calendar-grid-dayLine flex-item-fluid" key={day.getUTCDate()} />;
            })}
        </div>
    );
};

export default memo(DayLines);
