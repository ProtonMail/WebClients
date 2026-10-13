import type { SheetsMessages } from '../../messages/SheetsMessages'
import type { BorderStyle } from '@rowsncolumns/common-types'

export type BorderLocation = 'all' | 'outer' | 'inner' | 'vertical' | 'horizontal' | 'left' | 'right' | 'bottom' | 'top'

export function getBorderLocations(messages: SheetsMessages): {
  title: string
  location: BorderLocation | null
  icon: JSX.Element
}[] {
  return [
    {
      title: messages.borderData['All borders'],
      location: 'all',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16">
          <path
            stroke="#0C0C14"
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M2 8h12M8 2v12M5.2 2h5.6c1.12 0 1.68 0 2.108.218a2 2 0 0 1 .874.874C14 3.52 14 4.08 14 5.2v5.6c0 1.12 0 1.68-.218 2.108a2 2 0 0 1-.874.874C12.48 14 11.92 14 10.8 14H5.2c-1.12 0-1.68 0-2.108-.218a2 2 0 0 1-.874-.874C2 12.48 2 11.92 2 10.8V5.2c0-1.12 0-1.68.218-2.108a2 2 0 0 1 .874-.874C3.52 2 4.08 2 5.2 2"
          ></path>
        </svg>
      ),
    },
    {
      title: messages.borderData['Inner borders'],
      location: 'inner',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16">
          <path
            stroke="#0C0C14"
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M2 2h.007M2 14h.007M2 11h.007M2 5h.007M5 2h.007M5 14h.007M11 2h.007M11 14h.007M8 2h.007M8 14h.007M8 11h.007M8 5h.007M14 2h.007M14 14h.007M14 11h.007M14 5h.007M14 8H2M8 14V2"
          ></path>
        </svg>
      ),
    },
    {
      title: messages.borderData['Horizontal borders'],
      location: 'horizontal',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16">
          <path
            stroke="#0C0C14"
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M2 2h.007M2 14h.007M2 11h.007M2 5h.007M5 2h.007M5 14h.007M11 2h.007M11 14h.007M8 2h.007M8 14h.007M8 11h.007M8 5h.007M14 2h.007M14 14h.007M14 11h.007M14 5h.007M14 8H2"
          ></path>
        </svg>
      ),
    },
    {
      title: messages.borderData['Vertical borders'],
      location: 'vertical',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16">
          <path
            stroke="#0C0C14"
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M2 2h.007M2 8h.007M2 14h.007M2 11h.007M2 5h.007M5 2h.007M5 8h.007M5 14h.007M11 2h.007M11 8h.007M11 14h.007M14 2h.007M14 8h.007M14 14h.007M14 11h.007M14 5h.007M8 14V2"
          ></path>
        </svg>
      ),
    },
    {
      title: messages.borderData['Outer borders'],
      location: 'outer',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16">
          <path
            stroke="#0C0C14"
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M5 8h.007M11 8h.007M8 8h.007M8 11h.007M8 5h.007M2 5.2v5.6c0 1.12 0 1.68.218 2.108a2 2 0 0 0 .874.874C3.52 14 4.08 14 5.2 14h5.6c1.12 0 1.68 0 2.108-.218a2 2 0 0 0 .874-.874C14 12.48 14 11.92 14 10.8V5.2c0-1.12 0-1.68-.218-2.108a2 2 0 0 0-.874-.874C12.48 2 11.92 2 10.8 2H5.2c-1.12 0-1.68 0-2.108.218a2 2 0 0 0-.874.874C2 3.52 2 4.08 2 5.2"
          ></path>
        </svg>
      ),
    },
    {
      title: messages.borderData['Left border'],
      location: 'left',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16">
          <path
            stroke="#0C0C14"
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M5 2h.007M5 8h.007M5 14h.007M11 2h.007M11 8h.007M11 14h.007M8 2h.007M8 8h.007M8 14h.007M8 11h.007M8 5h.007M14 2h.007M14 8h.007M14 14h.007M14 11h.007M14 5h.007M2 14V2"
          ></path>
        </svg>
      ),
    },
    {
      title: messages.borderData['Top border'],
      location: 'top',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16">
          <path
            stroke="#0C0C14"
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M2 14h.007M2 8h.007M2 11h.007M2 5h.007M5 14h.007M5 8h.007M11 14h.007M11 8h.007M8 14h.007M8 8h.007M8 11h.007M8 5h.007M14 14h.007M14 8h.007M14 11h.007M14 5h.007M14 2H2"
          ></path>
        </svg>
      ),
    },
    {
      title: messages.borderData['Right border'],
      location: 'right',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16">
          <path
            stroke="#0C0C14"
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M5 2h.007M5 8h.007M5 14h.007M11 2h.007M11 8h.007M11 14h.007M8 2h.007M8 8h.007M8 14h.007M8 11h.007M8 5h.007M2 2h.007M2 8h.007M2 14h.007M2 11h.007M2 5h.007M14 14V2"
          ></path>
        </svg>
      ),
    },
    {
      title: messages.borderData['Bottom border'],
      location: 'bottom',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16">
          <path
            stroke="#0C0C14"
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M2 2h.007M2 8h.007M2 11h.007M2 5h.007M5 2h.007M5 8h.007M11 2h.007M11 8h.007M8 2h.007M8 8h.007M8 11h.007M8 5h.007M14 2h.007M14 8h.007M14 11h.007M14 5h.007M14 14H2"
          ></path>
        </svg>
      ),
    },
    {
      title: messages.borderData['No borders'],
      location: null,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16">
          <path
            stroke="#0C0C14"
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M2 2h.007M2 8h.007M2 14h.007M2 11h.007M2 5h.007M5 2h.007M5 8h.007M5 14h.007M11 2h.007M11 8h.007M11 14h.007M8 2h.007M8 8h.007M8 14h.007M8 11h.007M8 5h.007M14 2h.007M14 8h.007M14 14h.007M14 11h.007M14 5h.007"
          ></path>
        </svg>
      ),
    },
  ]
}

export function getBorderLineStyles(
  messages: SheetsMessages,
): { title: string; style: BorderStyle; icon: JSX.Element }[] {
  return [
    {
      title: messages.borderData.Solid,
      style: 'solid',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="50" height="1">
          <line x1="0" y1="0.5" x2="50" y2="0.5" strokeWidth="1" stroke="currentColor"></line>
        </svg>
      ),
    },
    {
      title: messages.borderData['Solid medium'],
      style: 'solid_medium',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="50" height="2">
          <line x1="0" y1="1.0" x2="50" y2="1.0" strokeWidth="2" stroke="currentColor"></line>
        </svg>
      ),
    },
    {
      title: messages.borderData['Solid thick'],
      style: 'solid_thick',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="50" height="3">
          <line x1="0" y1="1.5" x2="50" y2="1.5" strokeWidth="3" stroke="currentColor"></line>
        </svg>
      ),
    },
    {
      title: messages.borderData.Dashed,
      style: 'dashed',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="50" height="1">
          <line x1="0" y1="0.5" x2="50" y2="0.5" strokeWidth="1" stroke="currentColor" strokeDasharray="2"></line>
        </svg>
      ),
    },
    {
      title: messages.borderData.Dotted,
      style: 'dotted',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="50" height="1">
          <line x1="0" y1="0.5" x2="50" y2="0.5" strokeWidth="1" stroke="currentColor" strokeDasharray="1"></line>
        </svg>
      ),
    },
    {
      title: messages.borderData.Double,
      style: 'double',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="50" height="4">
          <line x1="0" y1="0.5" x2="50" y2="0.5" strokeWidth="1" stroke="currentColor"></line>
          <line x1="0" y1="3" x2="50" y2="3" strokeWidth="1" stroke="currentColor"></line>
        </svg>
      ),
    },
  ]
}

export const borderDataMessages = {
  borderData: {
    'All borders': `All borders`,
    'Inner borders': `Inner borders`,
    'Horizontal borders': `Horizontal borders`,
    'Vertical borders': `Vertical borders`,
    'Outer borders': `Outer borders`,
    'Top border': `Top border`,
    'Left border': `Left border`,
    'Right border': `Right border`,
    'Bottom border': `Bottom border`,
    Solid: `Solid`,
    'Solid medium': `Solid medium`,
    'Solid thick': `Solid thick`,
    Dashed: `Dashed`,
    Dotted: `Dotted`,
    Double: `Double`,
    'No borders': `No borders`,
  },
}
