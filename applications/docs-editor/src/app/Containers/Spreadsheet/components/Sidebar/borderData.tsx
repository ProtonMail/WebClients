import {
  MdBorderAll,
  MdBorderBottom,
  MdBorderHorizontal,
  MdBorderInner,
  MdBorderLeft,
  MdBorderOuter,
  MdBorderRight,
  MdBorderTop,
  MdBorderVertical,
} from '@rowsncolumns/icons'
import type { BorderStyle } from '@rowsncolumns/common-types'

export type BorderLocation = 'all' | 'outer' | 'inner' | 'vertical' | 'horizontal' | 'left' | 'right' | 'bottom' | 'top'

export const BORDER_LOCATIONS: {
  title: string
  location: BorderLocation
  icon: React.ComponentType
}[] = [
  {
    title: 'All borders',
    location: 'all',
    icon: MdBorderAll,
  },
  {
    title: 'Inner borders',
    location: 'inner',
    icon: MdBorderInner,
  },
  {
    title: 'Horizontal borders',
    location: 'horizontal',
    icon: MdBorderHorizontal,
  },
  {
    title: 'Vertical borders',
    location: 'vertical',
    icon: MdBorderVertical,
  },
  {
    title: 'Outer borders',
    location: 'outer',
    icon: MdBorderOuter,
  },
  {
    title: 'Left border',
    location: 'left',
    icon: MdBorderLeft,
  },
  {
    title: 'Top border',
    location: 'top',
    icon: MdBorderTop,
  },
  {
    title: 'Right border',
    location: 'right',
    icon: MdBorderRight,
  },
  {
    title: 'Bottom border',
    location: 'bottom',
    icon: MdBorderBottom,
  },
]

export const BORDER_LINE_STYLES: { title: string; style: BorderStyle; icon: JSX.Element }[] = [
  {
    title: 'Solid',
    style: 'solid',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="50" height="1">
        <line x1="0" y1="0.5" x2="50" y2="0.5" strokeWidth="1" stroke="currentColor"></line>
      </svg>
    ),
  },
  {
    title: 'Solid medium',
    style: 'solid_medium',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="50" height="2">
        <line x1="0" y1="1.0" x2="50" y2="1.0" strokeWidth="2" stroke="currentColor"></line>
      </svg>
    ),
  },
  {
    title: 'Solid thick',
    style: 'solid_thick',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="50" height="3">
        <line x1="0" y1="1.5" x2="50" y2="1.5" strokeWidth="3" stroke="currentColor"></line>
      </svg>
    ),
  },
  {
    title: 'Dashed',
    style: 'dashed',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="50" height="1">
        <line x1="0" y1="0.5" x2="50" y2="0.5" strokeWidth="1" stroke="currentColor" strokeDasharray="2"></line>
      </svg>
    ),
  },
  {
    title: 'Dotted',
    style: 'dotted',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="50" height="1">
        <line x1="0" y1="0.5" x2="50" y2="0.5" strokeWidth="1" stroke="currentColor" strokeDasharray="1"></line>
      </svg>
    ),
  },
  {
    title: 'Double',
    style: 'double',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="50" height="4">
        <line x1="0" y1="0.5" x2="50" y2="0.5" strokeWidth="1" stroke="currentColor"></line>
        <line x1="0" y1="3" x2="50" y2="3" strokeWidth="1" stroke="currentColor"></line>
      </svg>
    ),
  },
]
