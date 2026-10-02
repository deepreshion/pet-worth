import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { deleteMedicalEvent, getMedicalEvent, listMedicalEvents, saveMedicalEvent } from '@/services/medicalEvents'
import { petKeys } from '@/composables/usePets'

export const medicalEventKeys = {
  all: ['medical-events'] as const,
  pet: (petId: string) => ['medical-events', 'pet', petId] as const,
  detail: (id: string) => ['medical-events', 'detail', id] as const,
}

export function useMedicalEventsQuery(petId?: string) {
  return useQuery({ queryKey: petId ? medicalEventKeys.pet(petId) : medicalEventKeys.all, queryFn: () => listMedicalEvents(petId) })
}

export function useMedicalEventQuery(id: string) {
  return useQuery({ queryKey: medicalEventKeys.detail(id), queryFn: () => getMedicalEvent(id), enabled: Boolean(id) })
}

export function useSaveMedicalEventMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: saveMedicalEvent,
    onSuccess: async ({ eventId }, input) => Promise.all([
      queryClient.invalidateQueries({ queryKey: medicalEventKeys.all }),
      queryClient.invalidateQueries({ queryKey: medicalEventKeys.pet(input.petId) }),
      queryClient.invalidateQueries({ queryKey: medicalEventKeys.detail(eventId) }),
      queryClient.invalidateQueries({ queryKey: petKeys.detail(input.petId) }),
    ]),
  })
}

export function useDeleteMedicalEventMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteMedicalEvent,
    onSuccess: async () => queryClient.invalidateQueries({ queryKey: medicalEventKeys.all }),
  })
}
