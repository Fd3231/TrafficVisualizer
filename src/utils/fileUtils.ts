export function readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target && typeof event.target.result === "string") {
          resolve(event.target.result);
        } else {
          reject("Failed to read file");
        }
      };
      reader.onerror = (error) => reject(error);
      reader.readAsText(file);
    });
  }