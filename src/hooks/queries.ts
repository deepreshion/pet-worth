import type {
  CreatePetInput,
  UpdatePetInput,
  PetSummary,
} from "@/types/domain";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createPet, getPet, updatePet, uploadPetPhoto } from "@/services/pets";
import {
  deleteMedicalEvent,
  getMedicalEvent,
  saveMedicalEvent,
} from "@/services/medicalEvents";
import { getCurrentProfile, updateCurrentProfile } from "@/services/profile";
import { petsQueryOptions, eventsQueryOptions } from "./queryOptions";
export function usePets() {
  return useQuery(petsQueryOptions());
}
export function usePet(id: string) {
  const client = useQueryClient();
  return useQuery({
    queryKey: ["pets", id],
    queryFn: () => getPet(id),
    initialData: () =>
      client.getQueryData<PetSummary[]>(["pets"])?.find((pet) => pet.id === id),
    initialDataUpdatedAt: () => {
      const list = client.getQueryState(["pets"]);
      return list?.isInvalidated ? 0 : list?.dataUpdatedAt;
    },
    enabled: Boolean(id),
  });
}
export function useEvents(petId?: string) {
  return useQuery(eventsQueryOptions(petId));
}
export function useEvent(id: string) {
  return useQuery({
    queryKey: ["medical-events", "detail", id],
    queryFn: () => getMedicalEvent(id),
    enabled: Boolean(id),
  });
}
export function useProfile() {
  return useQuery({ queryKey: ["profile"], queryFn: getCurrentProfile });
}
export function useSavePet() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (
      input: CreatePetInput | (UpdatePetInput & { requestId: string }),
    ) => ("id" in input ? updatePet(input) : createPet(input)),
    onSuccess: () => client.invalidateQueries({ queryKey: ["pets"] }),
  });
}
export function useSaveEvent() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: saveMedicalEvent,
    onSuccess: () => client.invalidateQueries({ queryKey: ["medical-events"] }),
  });
}
export function useDeleteEvent() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: deleteMedicalEvent,
    onSuccess: () => client.invalidateQueries({ queryKey: ["medical-events"] }),
  });
}
export function useSaveProfile() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: updateCurrentProfile,
    onSuccess: () => client.invalidateQueries({ queryKey: ["profile"] }),
  });
}

export function useUploadPetPhoto() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      petId,
      familyId,
      photo,
    }: {
      petId: string;
      familyId: string;
      photo: import("@/types/domain").UploadAsset;
    }) => uploadPetPhoto(petId, familyId, photo),
    onSuccess: () => client.invalidateQueries({ queryKey: ["pets"] }),
  });
}
