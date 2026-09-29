import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { createPet, getPet, listPets, updatePet, uploadPetPhoto } from '@/services/pets'

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

export function useUpdatePetMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: updatePet,
    onSuccess: async ({ petId }) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: petKeys.all }),
        queryClient.invalidateQueries({ queryKey: petKeys.detail(petId) }),
      ])
    },
  })
}

export function useReplacePetPhotoMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ petId, familyId, photo }: { petId: string; familyId: string; photo: File }) => uploadPetPhoto(petId, familyId, photo),
    onSuccess: async (_, { petId }) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: petKeys.all }),
        queryClient.invalidateQueries({ queryKey: petKeys.detail(petId) }),
      ])
    },
  })
}
