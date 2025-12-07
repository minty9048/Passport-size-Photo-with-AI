export enum DocType {
  PASSPORT = 'Passport'
}

export enum OutputFormat {
  SINGLE_DIGITAL = 'Single Digital File',
  PRINT_SHEET = 'Printable 4x6 Sheet'
}

export enum ProcessingStatus {
  IDLE = 'idle',
  UPLOADING = 'uploading',
  PROCESSING = 'processing',
  GENERATING_SHEET = 'generating_sheet',
  COMPRESSING = 'compressing',
  SUCCESS = 'success',
  ERROR = 'error'
}

export type OutfitOption = 'original' | 'suit_male' | 'suit_female' | 'shirt_white';
export type BgColorOption = 'white' | 'light_blue' | 'light_gray';

// Specific KB limits common in India (Passport often <100KB, some exams <50KB)
export type FileSizeLimit = 'unlimited' | '50kb' | '100kb' | '200kb';

export interface PhotoConfig {
  widthMm: number;
  heightMm: number;
  minDpi: number;
  faceSizePercent: number; // Approximate
  bgColor: string;
}

export const DOC_CONFIGS: Record<DocType, PhotoConfig> = {
  [DocType.PASSPORT]: {
    widthMm: 51,
    heightMm: 51,
    minDpi: 300,
    faceSizePercent: 65,
    bgColor: 'White'
  }
};