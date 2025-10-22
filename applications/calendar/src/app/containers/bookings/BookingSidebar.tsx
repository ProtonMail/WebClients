import { BookingManagement } from './BookingsPageManagement';

export const BookingSidebar = () => {
    return (
        <div className="w-full sm:w-custom flex flex-column bg-norm px-6 py-4" style={{ '--w-custom': '15rem' }}>
            <BookingManagement.Header />
            <div className="grow">
                <BookingManagement.Form />
            </div>

            <BookingManagement.Buttons />
        </div>
    );
};
