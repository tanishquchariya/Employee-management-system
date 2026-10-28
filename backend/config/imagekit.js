import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOAD_DIR = path.join(__dirname, "..", "uploads");

// The SDK is loaded lazily so the server still boots (using local storage) when
// ImageKit isn't configured, and an SDK problem can never prevent startup.
let sdk = null;
let client = null;
const getClient = async () => {
  if (!client) {
    sdk = await import("@imagekit/nodejs");
    const ImageKit = sdk.default;
    client = new ImageKit({ privateKey: process.env.IMAGEKIT_PRIVATE_KEY });
  }
  return client;
};

const useImageKit = () => Boolean(process.env.IMAGEKIT_PRIVATE_KEY);

// Uploads an image buffer and returns { url }.
// With IMAGEKIT_PRIVATE_KEY set it goes to ImageKit; otherwise it is saved in
// backend/uploads and the returned url is the relative path "uploads/<file>"
// (index.js serves that folder and both frontends already prefix it with the API host).
export const uploadToImageKit = async (buffer, fileName) => {
  const safeName = String(fileName).replace(/[^a-zA-Z0-9._-]/g, "_");

  if (useImageKit()) {
    try {
      const imagekit = await getClient();
      const file = sdk.toFile ? await sdk.toFile(buffer, safeName) : new File([buffer], safeName);
      const result = await imagekit.files.upload({
        file,
        fileName: safeName,
        folder: "/ems/profiles",
      });
      return { url: result.url };
    } catch (err) {
      throw new Error(`Image upload failed: ${err.message}`);
    }
  }

  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  await fs.writeFile(path.join(UPLOAD_DIR, safeName), buffer);
  return { url: `uploads/${safeName}` };
};

// Best-effort delete of a previously uploaded image. Callers already .catch() failures.
export const deleteFromImageKit = async (url) => {
  if (!url) return;

  if (!url.startsWith("http")) {
    const relative = url.replace(/\\/g, "/");
    if (relative.startsWith("uploads/")) {
      await fs.unlink(path.join(UPLOAD_DIR, path.basename(relative))).catch(() => {});
    }
    return;
  }

  if (!useImageKit()) return;
  const fileName = decodeURIComponent(url.split("?")[0].split("/").pop());
  const imagekit = await getClient();
  const found = await imagekit.assets.list({
    searchQuery: `name="${fileName}"`,
    limit: 1,
  });
  const file = Array.isArray(found) ? found.find((item) => item.fileId) : null;
  if (file) await imagekit.files.delete(file.fileId);
};
