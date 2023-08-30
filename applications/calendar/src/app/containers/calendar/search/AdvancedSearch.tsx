// import { ChangeEvent, FormEvent, useEffect, useRef, useState } from 'react';
//
// import { fromUnixTime, getUnixTime } from 'date-fns';
// import { c } from 'ttag';
//
// import { Button } from '@proton/atoms';
//
// import { ESCalendarSearchParams } from '../../../interfaces/encryptedSearch';
// import CalendarSearchActivation from './CalendarSearchActivation';
// import CalendarSearchForm from './CalendarSearchForm';
// import { useCalendarSearch } from './CalendarSearchProvider';
// import SearchField from './SearchField';
// import { SearchModel } from './interface';
//
// const DEFAULT_MODEL: SearchModel = {
//     keyword: '',
// };
//
// const initializeModel = (params: ESCalendarSearchParams) => () => {
//     const { keyword, begin, end } = params;
//
//     return {
//         keyword: keyword || '',
//         startDate: begin !== undefined ? fromUnixTime(+begin) : undefined,
//         endDate: end !== undefined ? fromUnixTime(+end) : undefined,
//     };
// };
//
// interface Props {
//     searchInputParams: ESCalendarSearchParams;
//     isNarrow: boolean;
//     containerRef: HTMLDivElement | null;
//     isSearchActive: boolean;
//     onSearch: () => void;
//     onClose: () => void;
//     showMore: boolean;
//     toggleShowMore: () => void;
// }
//
// const AdvancedSearch = ({
//     searchInputParams,
//     isNarrow,
//     containerRef,
//     isSearchActive,
//     onSearch,
//     onClose,
//     showMore,
//     toggleShowMore,
// }: Props) => {
//     const searchInputRef = useRef<HTMLInputElement>(null);
//     const [model, updateModel] = useState<SearchModel>(initializeModel(searchInputParams));
//
//     const handleSearch = ({ target }: ChangeEvent<HTMLInputElement>) => {
//         if (!isSearchActive) {
//             return;
//         }
//         updateModel({ ...model, keyword: target.value });
//     };
//
//     const handleClear = () => {
//         updateModel((currentModel) => ({ ...currentModel, keyword: '' }));
//         searchInputRef.current?.focus();
//     };
//
//     const handleReset = (event: FormEvent) => {
//         event.preventDefault(); // necessary to block native reset behaviour
//
//         updateModel(DEFAULT_MODEL);
//         searchInputRef.current?.focus();
//     };
//
//     const canReset = false && !!(model.keyword || model.startDate || model.endDate);
//
//     // Taken from the useClickMailContent component
//     // '' mousedown and touchstart avoid issue with the click in portal (modal, notification, dropdown) ''
//     useEffect(() => {
//         if (!containerRef) {
//             return;
//         }
//         containerRef.addEventListener('mousedown', onClose, { passive: true });
//         containerRef.addEventListener('touchstart', onClose, { passive: true });
//
//         return () => {
//             containerRef.removeEventListener('mousedown', onClose);
//             containerRef.removeEventListener('touchstart', onClose);
//         };
//     }, [containerRef]);
//
//     return (
//         <form name="advanced-search" onSubmit={handleSubmit} onReset={handleReset}>
//             <div className="flex border-bottom px-1 pt-1 pb-2">
//                 <SearchField
//                     unstyled
//                     value={model.keyword}
//                     onChange={handleSearch}
//                     onSubmit={handleSubmit}
//                     showSearchIcon={false}
//                     disabled={!isSearchActive}
//                     ref={searchInputRef}
//                     suffix={
//                         model.keyword ? (
//                             <Button
//                                 shape="ghost"
//                                 color="weak"
//                                 size="small"
//                                 type="button"
//                                 data-testid="advanced-search:clear"
//                                 onClick={handleClear}
//                             >
//                                 {c('Action').t`Clear`}
//                             </Button>
//                         ) : null
//                     }
//                 />
//             </div>
//             {!isSearchActive ? (
//                 <CalendarSearchActivation onClose={onClose} />
//             ) : (
//                 <CalendarSearchForm
//                     model={model}
//                     isNarrow={isNarrow}
//                     showMore={showMore}
//                     canReset={canReset}
//                     updateModel={updateModel}
//                     toggleShowMore={toggleShowMore}
//                 />
//             )}
//         </form>
//     );
// };
//
// export default AdvancedSearch;
