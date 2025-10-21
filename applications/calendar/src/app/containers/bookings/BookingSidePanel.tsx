import { BookingManagement } from './BookingsPageManagement';

export const BookingSidePanel = () => {
    return (
        <div
            className="w-full sm:w-custom h-full flex flex-column absolute top-0 bg-norm px-6 py-4 sm:shadow-lifted "
            style={{ '--w-custom': '15rem' }}
        >
            <BookingManagement.Header />
            <div className="grow">
                <BookingManagement.Form />
            </div>

            <BookingManagement.Buttons />
        </div>
    );
};
