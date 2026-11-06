import { Platform } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import { pickDocuments, pickPhoto, readUpload } from "./files";

const mockCopy = jest.fn();
const mockRead = jest.fn();
const mockCreate = jest.fn();

jest.mock("expo-file-system", () => ({
  Paths: { cache: "file:///app/cache" },
  Directory: class {
    uri: string;
    constructor(...parts: string[]) {
      this.uri = parts.join("/");
    }
    create = mockCreate;
  },
  File: class {
    uri: string;
    size = 2048;
    constructor(...parts: (string | { uri: string })[]) {
      this.uri = parts
        .map((part) => (typeof part === "string" ? part : part.uri))
        .join("/");
    }
    copy(destination: { uri: string }) {
      return mockCopy(this.uri, destination.uri);
    }
    arrayBuffer() {
      return mockRead(this.uri);
    }
  },
}));
jest.mock("expo-document-picker", () => ({ getDocumentAsync: jest.fn() }));
jest.mock("expo-image-picker", () => ({
  requestMediaLibraryPermissionsAsync: jest.fn(async () => ({ granted: true })),
  launchImageLibraryAsync: jest.fn(async () => ({
    assets: [
      { uri: "file:///photo.jpg", fileName: "photo.jpg", fileSize: 100 },
    ],
  })),
}));
jest.mock("expo-sharing", () => ({}));
jest.mock("expo-web-browser", () => ({}));
jest.mock("@/lib/supabase", () => ({ supabase: {} }));

const pdf = {
  uri: "content://com.android.providers.downloads.documents/document/123",
  name: "Анализ крови.pdf",
  mimeType: "application/pdf",
  size: 1024,
  lastModified: 0,
};

beforeEach(() => {
  jest.clearAllMocks();
  mockCopy.mockResolvedValue(undefined);
  jest.mocked(DocumentPicker.getDocumentAsync).mockResolvedValue({
    canceled: false,
    assets: [pdf],
  });
});
afterEach(() => jest.restoreAllMocks());

it("copies the granted Android URI into the app cache before returning a readable PDF", async () => {
  jest.replaceProperty(Platform, "OS", "android");
  let finish!: () => void;
  mockCopy.mockImplementation(
    () =>
      new Promise<void>((resolve) => {
        finish = resolve;
      }),
  );
  let completed = false;
  const picking = pickDocuments().then((files) => {
    completed = true;
    return files;
  });
  await Promise.resolve();
  expect(completed).toBe(false);
  expect(DocumentPicker.getDocumentAsync).toHaveBeenCalledWith(
    expect.objectContaining({
      multiple: true,
      copyToCacheDirectory: false,
      type: expect.arrayContaining(["application/pdf"]),
    }),
  );
  expect(mockCopy).toHaveBeenCalledWith(
    pdf.uri,
    expect.stringContaining("file:///app/cache/pet-worth-uploads/"),
  );
  finish();
  const [file] = await picking;
  expect(file).toEqual({
    uri: mockCopy.mock.calls[0][1],
    name: pdf.name,
    mimeType: pdf.mimeType,
    size: pdf.size,
  });
  const bytes = new ArrayBuffer(1024);
  mockRead.mockResolvedValueOnce(bytes);
  expect(await readUpload(file)).toBe(bytes);
  expect(mockRead).toHaveBeenCalledWith(file.uri);
});

it("keeps the DocumentPicker cache copy on iOS before staging all selected documents", async () => {
  jest.replaceProperty(Platform, "OS", "ios");
  jest.mocked(DocumentPicker.getDocumentAsync).mockResolvedValueOnce({
    canceled: false,
    assets: [
      { ...pdf, uri: "file:///cache/first.pdf" },
      { ...pdf, uri: "file:///cache/second.pdf", size: undefined },
    ],
  });
  const files = await pickDocuments();
  expect(DocumentPicker.getDocumentAsync).toHaveBeenCalledWith(
    expect.objectContaining({ copyToCacheDirectory: true }),
  );
  expect(mockCopy).toHaveBeenCalledTimes(2);
  expect(files.map((file) => file.size)).toEqual([1024, 2048]);
});

it("returns no documents when selection is cancelled", async () => {
  jest
    .mocked(DocumentPicker.getDocumentAsync)
    .mockResolvedValueOnce({ canceled: true, assets: null });
  expect(await pickDocuments()).toEqual([]);
  expect(mockCopy).not.toHaveBeenCalled();
});

it("propagates an asynchronous copy failure to the form", async () => {
  const error = new Error("Missing 'READ' permission for accessing the file.");
  mockCopy.mockRejectedValueOnce(error);
  await expect(pickDocuments()).rejects.toBe(error);
});

it("also waits for photo staging and propagates copy failures", async () => {
  const error = new Error("copy failed");
  mockCopy.mockRejectedValueOnce(error);
  await expect(pickPhoto()).rejects.toBe(error);
});
