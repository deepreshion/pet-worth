import { queryOptions } from "@tanstack/react-query";
import { listPets } from "@/services/pets";
import { listMedicalEvents } from "@/services/medicalEvents";

export const petsQueryOptions = () =>
  queryOptions({ queryKey: ["pets"], queryFn: listPets });

export const eventsQueryOptions = (petId?: string) =>
  queryOptions({
    queryKey: ["medical-events", petId ?? "all"],
    queryFn: () => listMedicalEvents(petId),
  });
