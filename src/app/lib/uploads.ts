/** Local upload simulation. Data URLs survive refreshes without a storage service. */
export function uploadImageFile(file: File, _folder: string): Promise<string> {
  if (!file.type.startsWith("image/")) return Promise.reject(new Error("Select an image file to upload."));
  if (file.size > 2 * 1024 * 1024) return Promise.reject(new Error("Demo images must be under 2 MB because they are stored in this browser."));
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("Could not read the demo image."));
    reader.onerror = () => reject(new Error("Could not read the demo image."));
    reader.readAsDataURL(file);
  });
}
