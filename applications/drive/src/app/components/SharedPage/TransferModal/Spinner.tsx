import './Spinner.scss';

const Spinner = () => (
    <svg width="24" height="25" viewBox="0 0 24 25" fill="none">
        <path
            fillRule="evenodd"
            d="M11.4 15.2397L9.42427 13.2638C9.18995 13.0295 8.81005 13.0295 8.57574 13.2638C8.34142 13.4981 8.34142 13.8781 8.57574 14.1124L11.406 16.943C11.7341 17.2711 12.2659 17.2711 12.594 16.943L15.4243 14.1124C15.6586 13.8781 15.6586 13.4981 15.4243 13.2638C15.19 13.0295 14.8101 13.0295 14.5757 13.2638L12.6 15.2397L12.6 8.28756C12.6 7.95616 12.3314 7.6875 12 7.6875C11.6686 7.6875 11.4 7.95616 11.4 8.28756L11.4 15.2397Z"
            fill="#0C0C14"
        />
        <circle
            className="spinner-circle"
            cx="12"
            cy="12.5"
            r="10.5"
            stroke="#0C0C14"
            strokeWidth="1.5"
            strokeLinecap="square"
            strokeDasharray="8 8"
        />
    </svg>
);

export default Spinner;
