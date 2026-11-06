import { randomUUID } from "expo-crypto";
import { Platform } from "react-native";
import { Directory, File, Paths } from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import * as Sharing from "expo-sharing";
import * as WebBrowser from "expo-web-browser";
import type { MedicalAttachment, UploadAsset } from "@/types/domain";
import { supabase } from "@/lib/supabase";
async function staged(asset: UploadAsset) {
  const dir = new Directory(Paths.cache, "pet-worth-uploads");
  dir.create({ idempotent: true, intermediates: true });
  const file = new File(
    dir,
    `${randomUUID()}-${asset.name.replace(/[^a-zA-Z0-9.]/g, "_")}`,
  );
  await new File(asset.uri).copy(file);
  return { ...asset, uri: file.uri };
}
export async function readUpload(asset: UploadAsset) {
  return new File(asset.uri).arrayBuffer();
}
export async function pickPhoto(): Promise<UploadAsset | undefined> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) throw new Error("PHOTO_PERMISSION");
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    quality: 0.85,
  });
  const item = result.assets?.[0];
  if (!item) return;
  return staged({
    uri: item.uri,
    name: item.fileName ?? "photo.jpg",
    mimeType: item.mimeType ?? "image/jpeg",
    size: item.fileSize ?? new File(item.uri).size,
  });
}
export async function pickDocuments(): Promise<UploadAsset[]> {
  const result = await DocumentPicker.getDocumentAsync({
    type: [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/heic",
      "image/heif",
      "application/pdf",
    ],
    multiple: true,
    // Android grants access to the provider URI. DocumentPicker's cache can be
    // outside the FileSystem sandbox in Expo Go, so copy directly into ours.
    copyToCacheDirectory: Platform.OS !== "android",
  });
  return Promise.all(
    (result.assets ?? []).map((item) =>
      staged({
        uri: item.uri,
        name: item.name,
        mimeType: item.mimeType ?? "application/octet-stream",
        size: item.size ?? new File(item.uri).size,
      }),
    ),
  );
}
export async function freshAttachmentUrl(attachment: MedicalAttachment) {
  const { data, error } = await supabase.storage
    .from("medical-attachments")
    .createSignedUrl(attachment.storagePath, 60);
  if (error || !data?.signedUrl) throw new Error("FILE_LINK");
  return data.signedUrl;
}
const safeName = (name: string) =>
  name.replace(/[^\p{L}\p{N}._ -]/gu, "_").slice(0, 160) || "attachment";
const privateDirectory = () => {
  const directory = new Directory(Paths.document, "Pet Worth");
  directory.create({ idempotent: true, intermediates: true });
  return directory;
};
export async function downloadAttachment(attachment: MedicalAttachment) {
  const file = new File(
    privateDirectory(),
    `${attachment.id}-${safeName(attachment.fileName)}`,
  );
  await File.downloadFileAsync(await freshAttachmentUrl(attachment), file, {
    idempotent: true,
  });
  return file.uri;
}
export async function shareAttachment(attachment: MedicalAttachment) {
  const uri = await downloadAttachment(attachment);
  if (!(await Sharing.isAvailableAsync()))
    throw new Error("SHARING_UNAVAILABLE");
  await Sharing.shareAsync(uri, {
    mimeType: attachment.mediaType,
    dialogTitle: attachment.fileName,
  });
}
export async function openPdf(attachment: MedicalAttachment) {
  await WebBrowser.openBrowserAsync(await freshAttachmentUrl(attachment));
}
export function clearPrivateFiles() {
  const directory = new Directory(Paths.document, "Pet Worth");
  if (directory.exists) directory.delete();
  const uploads = new Directory(Paths.cache, "pet-worth-uploads");
  if (uploads.exists) uploads.delete();
}
