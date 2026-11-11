// Copy of the getInitials cases in packages/shared/tests/helpers/string.spec.ts

import { getInitials } from './getInitials'

describe('getInitials', () => {
  it('should handle empty parameter', () => {
    expect(getInitials()).toEqual('?')
  })

  it('should handle single character', () => {
    expect(getInitials('q')).toEqual('Q')
  })

  it('should handle unique word', () => {
    expect(getInitials('熊猫')).toEqual('熊')
  })

  it('should return 2 first initials and capitalize it', () => {
    expect(getInitials('Lorem ipsum dolor sit amet')).toEqual('LA')
  })

  it('should remove emoji', () => {
    expect(getInitials('🐼 Panda')).toEqual('P')
    expect(getInitials('Panda 🐼')).toEqual('P')
    expect(getInitials('🐼 Panda 🐼')).toEqual('P')
  })

  it('should keep only character and number', () => {
    expect(getInitials('22 - Name Mame')).toEqual('2M')
  })

  it('should remove undesired characters', () => {
    expect(getInitials('Thomas Anderson (@neo)')).toEqual('TN')
  })

  it('should work also with email address', () => {
    expect(getInitials('invitation2@pm.gg')).toEqual('I')
  })
})
