import { petPhotoSource, clearPetPhotoCache } from "./petPhotoCache";
import { Image } from "expo-image";
jest.mock("expo-image", () => ({
  Image: {
    clearMemoryCache: jest.fn(async () => true),
    clearDiskCache: jest.fn(async () => true),
  },
}));
const photo = {
  id: "ray",
  photoPath: "family/ray/version-1.jpg",
  photoUrl: "https://storage.test/photo?token=first",
};
it("shares a stable cache key between screens and refreshed signed URLs", () => {
  const list = petPhotoSource(photo)!;
  const detail = petPhotoSource({
    ...photo,
    photoUrl: "https://storage.test/photo?token=second",
  })!;
  expect(list.cacheKey).toBe(detail.cacheKey);
  expect(list.uri).not.toBe(detail.uri);
  expect(list.cacheKey).not.toContain("token=");
});
it("uses a new version when a photo is replaced and isolates pets", () => {
  expect(
    petPhotoSource({ ...photo, photoPath: "family/ray/version-2.jpg" })!
      .cacheKey,
  ).not.toBe(petPhotoSource(photo)!.cacheKey);
  expect(petPhotoSource({ ...photo, id: "luna" })!.cacheKey).not.toBe(
    petPhotoSource(photo)!.cacheKey,
  );
});
it("has no source without a URL and safely falls back to the URL when no path is available", () => {
  expect(petPhotoSource({ ...photo, photoUrl: null })).toBeNull();
  expect(petPhotoSource({ ...photo, photoPath: null })!.cacheKey).not.toBe(
    petPhotoSource({
      ...photo,
      photoPath: null,
      photoUrl: "https://other.test/new.jpg",
    })!.cacheKey,
  );
});
it("clears both native caches when leaving the account", async () => {
  await clearPetPhotoCache();
  expect(Image.clearMemoryCache).toHaveBeenCalledTimes(1);
  expect(Image.clearDiskCache).toHaveBeenCalledTimes(1);
});
