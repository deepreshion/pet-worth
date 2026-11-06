import { Image, type ImageSource } from "expo-image";
import type { PetSummary } from "@/types/domain";
export type Photo = Pick<PetSummary, "id" | "photoPath" | "photoUrl">;
export function petPhotoSource(pet: Photo): ImageSource | null {
  if (!pet.photoUrl) return null;
  return {
    uri: pet.photoUrl,
    // Uploads get a new immutable path. Signed URL tokens are transport details,
    // not image versions, so all screens share the same cached file.
    cacheKey: `pet-photo:${pet.id}:${pet.photoPath ?? pet.photoUrl}`,
  };
}
export async function clearPetPhotoCache() {
  await Promise.all([Image.clearMemoryCache(), Image.clearDiskCache()]);
}
