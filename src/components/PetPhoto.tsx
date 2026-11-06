import { Image, type ImageProps } from "expo-image";
import { petPhotoSource, type Photo } from "@/lib/petPhotoCache";
export function PetPhoto({
  pet,
  ...props
}: Omit<ImageProps, "source" | "cachePolicy" | "recyclingKey"> & {
  pet: Photo;
}) {
  const source = petPhotoSource(pet);
  return source ? (
    <Image
      {...props}
      source={source}
      cachePolicy="memory-disk"
      recyclingKey={source.cacheKey}
    />
  ) : null;
}
