export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      // Remove data URL prefix (data:image/jpeg;base64,)
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
  });
};

/**
 * Compresses a base64 image to be under a specific file size in KB.
 * Uses binary search on quality to find the best fit.
 */
export const compressToTargetSize = async (
  base64Data: string, // Full data URL or raw base64
  targetKb: number
): Promise<string> => {
  return new Promise((resolve, reject) => {
    // If no limit (passed as 0 or null), return original
    if (!targetKb || targetKb <= 0) {
      resolve(base64Data.startsWith('data:') ? base64Data : `data:image/jpeg;base64,${base64Data}`);
      return;
    }

    const img = new Image();
    img.src = base64Data.startsWith('data:') ? base64Data : `data:image/jpeg;base64,${base64Data}`;
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error("Canvas context unavailable"));
        return;
      }
      
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      let minQ = 0.1;
      let maxQ = 1.0;
      let bestUrl = canvas.toDataURL('image/jpeg', 0.95); // Default start
      let iterations = 0;

      const targetBytes = targetKb * 1024;

      const attemptCompression = () => {
        // Binary search for quality
        if (iterations > 6) {
          resolve(bestUrl);
          return;
        }

        const midQ = (minQ + maxQ) / 2;
        const candidateUrl = canvas.toDataURL('image/jpeg', midQ);
        
        // Calculate size (Base64 length * 0.75 approx equals byte size)
        const head = 'data:image/jpeg;base64,';
        const sizeInBytes = (candidateUrl.length - head.length) * 0.75;

        if (sizeInBytes <= targetBytes) {
          // This fits! Save it as best so far, try for higher quality
          bestUrl = candidateUrl;
          minQ = midQ; 
        } else {
          // Too big, reduce quality
          maxQ = midQ;
        }

        iterations++;
        attemptCompression();
      };

      attemptCompression();
    };

    img.onerror = () => reject(new Error("Failed to load image for compression"));
  });
};

export const createPrintSheet = async (
  photoBase64: string,
  widthMm: number,
  heightMm: number
): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!photoBase64) {
      reject(new Error("No image data provided for sheet generation"));
      return;
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      reject(new Error("Could not get canvas context"));
      return;
    }

    // Standard 4x6 inch photo paper at 300 DPI
    const DPI = 300;
    const MM_TO_INCH = 0.0393701;
    
    const sheetWidthPx = 6 * DPI; // 1800 px (6 inches)
    const sheetHeightPx = 4 * DPI; // 1200 px (4 inches)
    
    canvas.width = sheetWidthPx;
    canvas.height = sheetHeightPx;

    // Fill white background explicitly
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, sheetWidthPx, sheetHeightPx);

    // Calculate photo pixel size
    // 51mm is approx 602 pixels. 3x 51mm = 153mm, which is > 6 inches (152.4mm).
    // So 3 photos across will slightly overflow a 4x6 sheet if printed full bleed.
    // We will center the grid so the crop is evenly distributed (negligible loss).
    const photoWidthPx = widthMm * MM_TO_INCH * DPI;
    const photoHeightPx = heightMm * MM_TO_INCH * DPI;

    const img = new Image();
    
    // Safety timeout
    const timeout = setTimeout(() => {
      reject(new Error("Image load timed out"));
    }, 5000);

    img.onload = () => {
      clearTimeout(timeout);
      
      const cols = 3;
      const rows = 2;
      
      const totalGridWidth = cols * photoWidthPx;
      const totalGridHeight = rows * photoHeightPx;
      
      // Calculate starting position to center the grid
      // This might be negative if the grid is larger than the sheet (which is true for 51mm on 4x6)
      const startX = (sheetWidthPx - totalGridWidth) / 2;
      const startY = (sheetHeightPx - totalGridHeight) / 2;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = startX + c * photoWidthPx;
          const y = startY + r * photoHeightPx;
          
          ctx.drawImage(img, x, y, photoWidthPx, photoHeightPx);
          
          // Draw light cut lines/guides
          // We draw the rect slightly inside to ensure it's visible if not clipped
          ctx.strokeStyle = '#d1d5db'; // Light gray
          ctx.lineWidth = 1;
          ctx.strokeRect(x, y, photoWidthPx, photoHeightPx);
        }
      }

      // Convert back to base64
      try {
        const result = canvas.toDataURL('image/jpeg', 0.95);
        resolve(result);
      } catch (e) {
        reject(e);
      }
    };
    
    img.onerror = () => {
      clearTimeout(timeout);
      reject(new Error("Failed to load image for sheet generation"));
    };
    
    img.crossOrigin = "Anonymous";
    img.src = `data:image/jpeg;base64,${photoBase64}`;
  });
};