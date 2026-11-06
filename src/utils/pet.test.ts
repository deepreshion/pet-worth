import {
  approximateBirthDate,
  approximateAgeParts,
  validatePhoto,
} from "./pet";
it("clamps approximate birth dates at month end", () => {
  expect(approximateBirthDate(0, 1, new Date("2026-03-31T12:00:00Z"))).toBe(
    "2026-02-28",
  );
});
it("computes age without negative months", () => {
  expect(approximateAgeParts("2026-12-01", new Date("2026-11-01"))).toEqual({
    years: 0,
    months: 0,
  });
});
it("validates native photo metadata before reading files", () => {
  expect(
    validatePhoto({
      uri: "file:///photo",
      name: "x.jpg",
      mimeType: "image/jpeg",
      size: 100,
    }),
  ).toBeNull();
  expect(
    validatePhoto({
      uri: "file:///photo",
      name: "x.pdf",
      mimeType: "application/pdf",
      size: 100,
    }),
  ).toBe("PHOTO_TYPE_INVALID");
  expect(
    validatePhoto({
      uri: "file:///photo",
      name: "x.jpg",
      mimeType: "image/jpeg",
      size: 0,
    }),
  ).toBe("PHOTO_TOO_LARGE");
});
