// Reference: https://web.dev/patterns/files/save-a-file

export async function saveFile(blob: Blob, suggestedName: string) {
  const supportsFileSystemAccess = "showSaveFilePicker" in window &&
    (() => {
      try {
        return self === top;
      } catch {
        return false;
      }
    })();

  if (supportsFileSystemAccess) {
    try {
      const handle = await showSaveFilePicker({
        suggestedName,
      });

      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
    } catch (e) {
      if (e instanceof Error && e.name == "AbortError") {
        return;
      }

      throw e;
    }
  } else {
    const blobURL = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = blobURL;
    a.download = suggestedName;
    a.style.display = "none";

    document.body.append(a);

    a.click();

    setTimeout(() => {
      URL.revokeObjectURL(blobURL);
      a.remove();
    }, 1000);
  }
}
