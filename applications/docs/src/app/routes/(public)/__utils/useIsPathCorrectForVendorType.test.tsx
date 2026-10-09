import { renderHook } from '@testing-library/react'
import { createBrowserHistory } from 'history'
import type { ReactNode } from 'react'
import { Router } from 'react-router-dom'
import { CompatRouter, useLocation } from 'react-router-dom-v5-compat'

import { HandshakeInfoVendorType } from '@proton/shared/lib/interfaces/drive/sharing'

import { useIsPathCorrectForVendorType } from './useIsPathCorrectForVendorType'

/** `ProtonSheet` is not a member of the enum yet */
const ProtonSheet = 2 as HandshakeInfoVendorType

const QUERY = '?mode=open-url&token=TOKEN&linkId=LINK'
const HASH = '#urlPassword'

describe('useIsPathCorrectForVendorType', () => {
  it.each([
    { name: 'document', vendorType: HandshakeInfoVendorType.ProtonDoc, expectedPathname: '/doc' },
    { name: 'spreadsheet', vendorType: ProtonSheet, expectedPathname: '/sheet' },
  ])('adds the type segment for a $name opened from a root link', ({ vendorType, expectedPathname }) => {
    const { results, getLocation } = render(`/${QUERY}${HASH}`, vendorType)

    expect(results[0]).toBe(false)
    expect(results.at(-1)).toBe(true)
    expect(getLocation()).toEqual({ pathname: expectedPathname, search: QUERY, hash: HASH })
  })

  it.each([
    { name: 'document', vendorType: HandshakeInfoVendorType.ProtonDoc, from: '/sheet', to: '/doc' },
    { name: 'spreadsheet', vendorType: ProtonSheet, from: '/doc', to: '/sheet' },
  ])('replaces $from with $to for a $name', ({ vendorType, from, to }) => {
    const { results, getLocation } = render(`${from}${QUERY}${HASH}`, vendorType)

    expect(results[0]).toBe(false)
    expect(results.at(-1)).toBe(true)
    expect(getLocation()).toEqual({ pathname: to, search: QUERY, hash: HASH })
  })

  it('keeps the local id prefix', () => {
    const { getLocation } = render(`/u/1/${QUERY}${HASH}`, ProtonSheet)

    expect(getLocation().pathname).toBe('/u/1/sheet')
  })

  it('replaces the history entry instead of adding one', () => {
    window.history.replaceState(null, '', `/${QUERY}${HASH}`)
    const historyLength = window.history.length

    render(`/${QUERY}${HASH}`, ProtonSheet)

    expect(window.history.length).toBe(historyLength)
  })

  it.each([
    { name: 'document', vendorType: HandshakeInfoVendorType.ProtonDoc, pathname: '/doc' },
    { name: 'spreadsheet', vendorType: ProtonSheet, pathname: '/sheet' },
    { name: 'spreadsheet', vendorType: ProtonSheet, pathname: '/u/1/sheet' },
  ])('leaves $pathname alone for a $name', ({ vendorType, pathname }) => {
    const { results, getLocation } = render(`${pathname}${QUERY}${HASH}`, vendorType)

    expect(results).not.toContain(false)
    expect(getLocation().pathname).toBe(pathname)
  })

  it.each([
    { name: 'the type is not known yet', vendorType: undefined },
    { name: 'the link is not a document', vendorType: HandshakeInfoVendorType.ProtonDrive },
    { name: 'the vendor type is unknown', vendorType: 3 as HandshakeInfoVendorType },
  ])('leaves the path alone when $name', ({ vendorType }) => {
    const { results, getLocation } = render(`/${QUERY}${HASH}`, vendorType)

    expect(results).not.toContain(false)
    expect(getLocation().pathname).toBe('/')
  })

  it('stops checking the path once the content has rendered', () => {
    const { results, getLocation } = render(`/${QUERY}${HASH}`, ProtonSheet, true)

    expect(results).not.toContain(false)
    expect(getLocation().pathname).toBe('/')
  })
})

function render(url: string, vendorType: HandshakeInfoVendorType | undefined, hasRenderedContent = false) {
  window.history.replaceState(null, '', url)
  const history = createBrowserHistory()
  const wrapper = ({ children }: { children: ReactNode }) => (
    <Router history={history}>
      <CompatRouter>{children}</CompatRouter>
    </Router>
  )

  const results: boolean[] = []
  const { result } = renderHook(
    () => {
      const isPathCorrect = useIsPathCorrectForVendorType(vendorType, hasRenderedContent)
      results.push(isPathCorrect)
      return useLocation()
    },
    { wrapper },
  )

  return {
    results,
    getLocation: () => {
      const { pathname, search, hash } = result.current
      return { pathname, search, hash }
    },
  }
}
