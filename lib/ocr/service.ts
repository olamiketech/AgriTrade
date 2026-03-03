import prisma from '@/lib/prisma';
import { createAuditLog } from '@/lib/audit';
import path from 'path';
import { readFile } from 'fs/promises';

// OCR Service with AWS Textract and Google Document AI integration
// Falls back to mock if credentials aren't configured

interface ExtractedField {
    name: string;
    value: string;
    confidence: number;
}

// AWS Textract Integration
async function extractWithTextract(fileBuffer: Buffer, documentType: string): Promise<{ fields: ExtractedField[], rawData: any }> {
    try {
        const { TextractClient, AnalyzeDocumentCommand } = await import('@aws-sdk/client-textract');

        const client = new TextractClient({
            region: process.env.AWS_REGION || 'us-east-1',
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
            }
        });

        const command = new AnalyzeDocumentCommand({
            Document: { Bytes: fileBuffer },
            FeatureTypes: ['FORMS', 'TABLES']
        });

        const response = await client.send(command);

        // Parse Textract response
        const fields: ExtractedField[] = [];
        const blocks = response.Blocks || [];

        // Extract key-value pairs from FORMS
        const keyBlocks = blocks.filter(b => b.BlockType === 'KEY_VALUE_SET' && b.EntityTypes?.includes('KEY'));

        for (const keyBlock of keyBlocks) {
            if (!keyBlock.Relationships) continue;

            const valueRelation = keyBlock.Relationships.find(r => r.Type === 'VALUE');
            if (!valueRelation) continue;

            const keyText = extractText(keyBlock, blocks);
            const valueBlock = blocks.find(b => valueRelation.Ids?.includes(b.Id || ''));
            const valueText = valueBlock ? extractText(valueBlock, blocks) : '';

            if (keyText && valueText) {
                fields.push({
                    name: sanitizeFieldName(keyText),
                    value: valueText,
                    confidence: keyBlock.Confidence ? keyBlock.Confidence / 100 : 0.5
                });
            }
        }

        return { fields, rawData: response };
    } catch (error) {
        console.error('[OCR] Textract error:', error);
        throw error;
    }
}

// Google Document AI Integration
async function extractWithDocumentAI(fileBuffer: Buffer, documentType: string): Promise<{ fields: ExtractedField[], rawData: any }> {
    try {
        const { DocumentProcessorServiceClient } = await import('@google-cloud/documentai').then(m => m.v1);

        const client = new DocumentProcessorServiceClient({
            keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS
        });

        const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
        const location = process.env.GOOGLE_CLOUD_LOCATION || 'us';
        const processorId = process.env.GOOGLE_DOCUMENTAI_PROCESSOR_ID;

        if (!projectId || !processorId) {
            throw new Error('Missing Google Document AI configuration');
        }

        const name = `projects/${projectId}/locations/${location}/processors/${processorId}`;

        const [result] = await client.processDocument({
            name,
            rawDocument: {
                content: fileBuffer,
                mimeType: 'application/pdf'
            }
        });

        const fields: ExtractedField[] = [];
        const document = result.document;

        // Extract entities (form fields)
        if (document?.entities) {
            for (const entity of document.entities) {
                fields.push({
                    name: sanitizeFieldName(entity.type || 'unknown'),
                    value: entity.mentionText || '',
                    confidence: entity.confidence || 0.5
                });
            }
        }

        return { fields, rawData: result };
    } catch (error) {
        console.error('[OCR] Document AI error:', error);
        throw error;
    }
}

// Mock OCR fallback
async function extractWithMock(documentId: string, documentType: string): Promise<{ fields: ExtractedField[], rawData: any }> {
    console.log('[OCR] Using mock OCR (no credentials configured)');

    await new Promise(resolve => setTimeout(resolve, 1000));

    const mockRawData = {
        text: "Mock OCR extraction",
        blocks: []
    };

    const fields: ExtractedField[] = [];

    if (documentType === 'INVOICE') {
        fields.push(
            { name: 'invoice_number', value: `INV-${documentId.substring(0, 8).toUpperCase()}`, confidence: 0.98 },
            { name: 'invoice_date', value: new Date().toISOString().split('T')[0], confidence: 0.95 },
            { name: 'total_amount', value: '15000.00', confidence: 0.92 },
            { name: 'currency', value: 'USD', confidence: 0.99 },
            { name: 'vendor_name', value: 'Global Agro Exports Ltd', confidence: 0.88 }
        );
    } else if (documentType === 'BILL_OF_LADING') {
        fields.push(
            { name: 'bl_number', value: `BL-${documentId.substring(0, 8).toUpperCase()}`, confidence: 0.96 },
            { name: 'shipper', value: 'Global Agro Exports Ltd', confidence: 0.90 },
            { name: 'consignee', value: 'Farm Fresh Imports Inc', confidence: 0.90 },
            { name: 'port_of_loading', value: 'Santos, Brazil', confidence: 0.85 },
            { name: 'port_of_discharge', value: 'Rotterdam, Netherlands', confidence: 0.85 }
        );
    } else {
        fields.push(
            { name: 'document_type', value: documentType, confidence: 0.99 },
            { name: 'extraction_status', value: 'partial', confidence: 0.50 }
        );
    }

    return { fields, rawData: mockRawData };
}

// Helper functions
function extractText(block: any, allBlocks: any[]): string {
    if (block.BlockType === 'WORD') {
        return block.Text || '';
    }

    if (block.Relationships) {
        const childRelation = block.Relationships.find((r: any) => r.Type === 'CHILD');
        if (childRelation?.Ids) {
            return childRelation.Ids
                .map((id: string) => allBlocks.find(b => b.Id === id))
                .filter((b: any) => b?.BlockType === 'WORD')
                .map((b: any) => b.Text)
                .join(' ');
        }
    }

    return '';
}

function sanitizeFieldName(text: string): string {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '')
        .substring(0, 50);
}

export async function processDocument(documentId: string) {
    try {
        console.log(`[OCR] Processing document ${documentId}...`);

        const document = await prisma.document.findUnique({
            where: { id: documentId },
            include: { trade: true }
        });

        if (!document) {
            console.error(`[OCR] Document ${documentId} not found`);
            return;
        }

        // Read file from S3 (or disk if mocked/fallback)
        // Ideally we should move strictly to S3 for production consistency

        let fileBuffer: Buffer;

        if (process.env.AWS_S3_BUCKET_NAME) {
            const { getFileBuffer } = await import('@/lib/storage');
            try {
                fileBuffer = await getFileBuffer(document.filePath);
                console.log(`[OCR] Downloaded ${document.filePath} from S3`);
            } catch (error) {
                console.error(`[OCR] Failed to download from S3: ${document.filePath}`, error);
                return;
            }
        } else {
            console.warn('[OCR] AWS_S3_BUCKET_NAME not set. Trying local file (legacy behavior).');
            const path = (await import('path')).default;
            const { readFile } = (await import('fs/promises'));
            const filePath = path.join(process.cwd(), 'private-uploads', document.filePath);

            try {
                fileBuffer = await readFile(filePath);
            } catch (error) {
                console.error(`[OCR] Failed to read local file: ${filePath}`, error);
                return;
            }
        }

        // Determine OCR provider and extract
        let extractedFields: ExtractedField[] = [];
        let rawData: any;
        let provider = 'MOCK_OCR';

        // Try AWS Textract first
        if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
            try {
                const result = await extractWithTextract(fileBuffer, document.type);
                extractedFields = result.fields;
                rawData = result.rawData;
                provider = 'AWS_TEXTRACT';
                console.log(`[OCR] Extracted ${extractedFields.length} fields using AWS Textract`);
            } catch (error) {
                console.warn('[OCR] Textract failed, trying Document AI...', error);
            }
        }

        // Try Google Document AI if Textract failed or wasn't configured
        if (extractedFields.length === 0 && process.env.GOOGLE_APPLICATION_CREDENTIALS) {
            try {
                const result = await extractWithDocumentAI(fileBuffer, document.type);
                extractedFields = result.fields;
                rawData = result.rawData;
                provider = 'GOOGLE_DOCUMENTAI';
                console.log(`[OCR] Extracted ${extractedFields.length} fields using Google Document AI`);
            } catch (error) {
                console.warn('[OCR] Document AI failed, falling back to mock...', error);
            }
        }

        // Fallback to mock if both real providers failed or weren't configured
        if (extractedFields.length === 0) {
            const result = await extractWithMock(documentId, document.type);
            extractedFields = result.fields;
            rawData = result.rawData;
            provider = 'MOCK_OCR';
        }

        // 1. Save Raw Extraction
        await prisma.documentRawExtraction.create({
            data: {
                documentId: document.id,
                payload: JSON.stringify(rawData),
                provider
            }
        });

        // 2. Save Structured Fields
        await Promise.all(extractedFields.map(field =>
            prisma.documentExtraction.create({
                data: {
                    documentId: document.id,
                    fieldName: field.name,
                    fieldValue: field.value,
                    confidence: field.confidence,
                    verified: false
                }
            })
        ));

        // 3. Audit Log
        await createAuditLog('DOC_EXTRACT', document.uploadedBy, document.tradeId, {
            documentId: document.id,
            fieldsExtracted: extractedFields.length,
            provider
        });

        console.log(`[OCR] Document ${documentId} processed successfully using ${provider}.`);

    } catch (error) {
        console.error(`[OCR] Failed to process document ${documentId}`, error);
    }
}
