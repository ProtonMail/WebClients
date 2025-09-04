import { clsx } from 'clsx';

type EmptyFileCardProps = {};

export function EmptyFileCard(_props: EmptyFileCardProps) {
    return (
        <div
            className={clsx(
                'group/filecard relative min-w-1/4 max-w-1/4 border-dashed border rounded-lg p-4 bg-transparent text-[var(--text-weak)]"',
                'select-none',
                'hover:bg-primary hover:text-grey-100 hover:border-grey-100 hover:text-white'
            )}
        >
            <div className="relative flex flex-column items-center h-full">
                <div className="absolute inset-0 visibility-hidden group-hover/filecard:visible flex flex-row z-10">
                    <p className="m-0 mx-auto self-center">Add a new file</p>
                </div>
                <div
                    className="rounded-full p-0 my-auto w-[24px] h-[24px] bg-transparent group-hover/filecard:-z-10"
                    color="norm"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        fill="currentColor"
                        className="mx-auto"
                        viewBox="0 0 16 16"
                    >
                        <path
                            fillRule="evenodd"
                            d="M8 2a.5.5 0 0 1 .5.5v5h5a.5.5 0 0 1 0 1h-5v5a.5.5 0 0 1-1 0v-5h-5a.5.5 0 0 1 0-1h5v-5A.5.5 0 0 1 8 2"
                        />
                    </svg>
                </div>
            </div>
        </div>
    );
}
