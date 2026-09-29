import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { getCurrentProfile, updateCurrentProfile } from '@/services/profile'

export const profileKeys = { current: ['profile', 'current'] as const }

export function useProfileQuery() {
  return useQuery({ queryKey: profileKeys.current, queryFn: getCurrentProfile })
}

export function useUpdateProfileMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: updateCurrentProfile,
    onSuccess: (profile) => queryClient.setQueryData(profileKeys.current, profile),
  })
}
