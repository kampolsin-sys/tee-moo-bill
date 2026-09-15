const UPLOAD_API_URL = 'https://script.google.com/macros/s/AKfycbz5pYFLIjKZoBN3JR2hLUhCJTGOScxhvYnwFn5Acg1vy2GpxTID_E2VE3RGXF17q5Bs/exec';

export async function uploadReceipt(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64Data = (reader.result as string).split(',')[1];
        
        // We use text/plain to avoid CORS preflight OPTIONS request
        const response = await fetch(UPLOAD_API_URL, {
          method: 'POST',
          body: JSON.stringify({
            base64: base64Data,
            filename: file.name,
            mimeType: file.type
          })
        });
        
        const result = await response.json();
        
        if (result.success) {
          resolve(result.url);
        } else {
          reject(new Error(result.error || 'Upload failed'));
        }
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}
