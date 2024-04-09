interface Props {
    hours: Date[];
}
const HourLines = ({ hours }: Props) => {
    return (
        <div className="calendar-grid-hours" aria-hidden="true">
            {hours.map((hour) => {
                return <div className="calendar-grid-hourLine" key={hour.getUTCHours()} />;
            })}
        </div>
    );
};

export default HourLines;
