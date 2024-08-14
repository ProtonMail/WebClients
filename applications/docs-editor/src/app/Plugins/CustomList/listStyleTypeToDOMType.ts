import type { CustomListDOMType, CustomListStyleType } from './CustomListTypes'

export function listStyleTypeToDOMType(listStyleType: CustomListStyleType): CustomListDOMType {
  switch (listStyleType) {
    case 'lower-alpha':
      return 'a'
    case 'upper-alpha':
      return 'A'
    case 'upper-roman':
      return 'I'
  }
}
