import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { createPet, getPet, listPets } from '@/services/pets'

export const petKeys = {
  all: ['pets'] as const,
  detail: (id: string) => ['pets', id] as const,
}

export function usePetsQuery() {
  return useQuery({ queryKey: petKeys.all, queryFn: listPets })
}

export function usePetQuery(id: string) {
  return useQuery({ queryKey: petKeys.detail(id), queryFn: () => getPet(id), enabled: Boolean(id) })
}

export function useCreatePetMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createPet,
    onSuccess: async () => queryClient.invalidateQueries({ queryKey: petKeys.all }),
  })
}
