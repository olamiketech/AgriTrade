
export interface ExtractedField {
    name: string;
    value: string;
    confidence: number;
}

export interface OCRResult {
    text: string; // Raw text if needed, or structured
    fields: ExtractedField[];
}

export interface OCRProvider {
    extract(fileBuffer: Buffer, mimeType: string, filename: string): Promise<OCRResult>;
}
