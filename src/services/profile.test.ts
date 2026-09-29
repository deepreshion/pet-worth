import { beforeEach, describe, expect, it } from 'vitest'
import { disableDemoMode, enableDemoMode } from '@/lib/demo'
import { getCurrentProfile, updateCurrentProfile } from './profile'

describe('profile service in development demo mode', () => {
  beforeEach(() => { window.localStorage.clear(); enableDemoMode() })
  it('reads and persists display name using the device timezone', async () => {
    const profile = await getCurrentProfile()
    expect(profile.email).toBe('demo@petworth.local')
    await updateCurrentProfile({ displayName: 'Руслан' })
    expect(await getCurrentProfile()).toMatchObject({ displayName: 'Руслан', timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC' })
    disableDemoMode()
  })
})
