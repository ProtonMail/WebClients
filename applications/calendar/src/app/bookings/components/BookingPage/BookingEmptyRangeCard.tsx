interface Props {
    message: React.ReactNode;
    action?: React.ReactNode;
}

export const BookingEmptyRangeCard = ({ message, action }: Props) => {
    return (
        <div className="border rounded-xl flex flex-column items-center justify-center p-20 mt-2 text-center booking-no-booking-container">
            <div>{message}</div>
            {action && <div>{action}</div>}
        </div>
    );
};
