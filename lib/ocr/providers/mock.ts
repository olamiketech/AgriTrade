import { OCRProvider, OCRResult } from '../types';

export class MockOCRProvider implements OCRProvider {
    async extract(fileBuffer: Buffer, mimeType: string, filename: string): Promise<OCRResult> {
        // Simulate processing delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        console.log(`[MockOCR] Processing ${filename} (${mimeType})`);

        // Return deterministic mock data based on filename or just generic data
        return {
            text: "MOCK OCR TEXT OUTPUT",
            fields: [
                { name: 'invoice_number', value: 'INV-' + Math.floor(Math.random() * 10000), confidence: 0.98 },
                { name: 'invoice_date', value: new Date().toISOString().split('T')[0], confidence: 0.95 },
                { name: 'total_amount', value: '15000.00', confidence: 0.92 },
                { name: 'currency', value: 'USD', confidence: 0.99 },
                { name: 'vendor_name', value: 'AgriCorp International', confidence: 0.88 },
            ]
        };
    }
}
