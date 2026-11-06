import { uploadPetPhoto } from "./pets";
jest.mock("@/platform/files", () => ({
  readUpload: jest.fn(async () => new ArrayBuffer(3)),
}));

const mockServices = { upload: jest.fn(), remove: jest.fn(), rpc: jest.fn() };
jest.mock("@/lib/supabase", () => ({
  supabase: {
    storage: {
      from: () => ({
        upload: mockServices.upload,
        remove: mockServices.remove,
      }),
    },
    rpc: (...args: unknown[]) => mockServices.rpc(...args),
  },
}));

describe("photo replacement", () => {
  beforeEach(() => {
    mockServices.upload.mockReset().mockResolvedValue({ error: null });
    mockServices.remove.mockReset().mockResolvedValue({ error: null });
    mockServices.rpc.mockReset();
  });

  it("removes the new object when database update fails", async () => {
    mockServices.rpc.mockResolvedValue({
      data: null,
      error: new Error("db failed"),
    });
    await expect(
      uploadPetPhoto("pet-id", "family-id", {
        uri: "file:///pet.jpg",
        name: "pet.jpg",
        mimeType: "image/jpeg",
        size: 1,
      }),
    ).rejects.toThrow("db failed");
    expect(mockServices.remove).toHaveBeenCalledTimes(1);
    expect(mockServices.remove.mock.calls[0][0][0]).toMatch(
      /^family-id\/pet-id\//,
    );
  });

  it("deletes the old object only after the new path is stored", async () => {
    mockServices.rpc.mockResolvedValue({
      data: "family-id/pet-id/old.jpg",
      error: null,
    });
    await uploadPetPhoto("pet-id", "family-id", {
      uri: "file:///pet.jpg",
      name: "pet.jpg",
      mimeType: "image/jpeg",
      size: 1,
    });
    expect(mockServices.rpc).toHaveBeenCalledTimes(1);
    expect(mockServices.remove).toHaveBeenLastCalledWith([
      "family-id/pet-id/old.jpg",
    ]);
  });
});
