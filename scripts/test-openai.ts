#!/usr/bin/env tsx

/**
 * Test script for OpenAI integration
 * Tests the dossier summarization with real OpenAI API
 */

import { generateDossierSummary } from '../lib/llm/summarizer';
import prisma from '../lib/prisma';

async function testOpenAIIntegration() {
    console.log('🧪 Testing OpenAI Integration...\n');

    try {
        // 1. Check environment
        console.log('1️⃣ Checking environment...');
        if (!process.env.OPENAI_API_KEY) {
            console.error('❌ OPENAI_API_KEY not found in environment!');
            process.exit(1);
        }
        console.log('✅ OPENAI_API_KEY found\n');

        // 2. Find a trade with documents
        console.log('2️⃣ Finding a trade with documents...');
        const trade = await prisma.tradeDeal.findFirst({
            where: {
                documents: {
                    some: {
                        extractions: {
                            some: {
                                verified: true
                            }
                        }
                    }
                }
            },
            include: {
                documents: {
                    include: {
                        extractions: true
                    }
                },
                exporter: {
                    include: {
                        user: true
                    }
                }
            }
        });

        if (!trade) {
            console.log('⚠️  No trade with verified document extractions found.');
            console.log('Creating a test scenario...\n');

            // Find any trade with documents
            const anyTrade = await prisma.tradeDeal.findFirst({
                include: {
                    documents: true,
                    exporter: {
                        include: {
                            user: true
                        }
                    }
                }
            });

            if (!anyTrade) {
                console.error('❌ No trades found in database. Please create a trade first.');
                process.exit(1);
            }

            console.log(`✅ Found trade: ${anyTrade.id}`);
            console.log(`   Exporter: ${anyTrade.exporter.companyName}`);
            console.log(`   Product: ${anyTrade.productDetails}`);
            console.log(`   Documents: ${anyTrade.documents.length}\n`);

            // 3. Test with available data
            console.log('3️⃣ Generating dossier summary with OpenAI GPT-4o...');
            const userId = anyTrade.exporter.userId;

            const summary = await generateDossierSummary(anyTrade.id, userId);

            console.log('\n✅ Summary generated successfully!\n');
            console.log('📊 Summary Details:');
            console.log(`   ID: ${summary.id}`);
            console.log(`   Model: ${summary.modelVersion}`);
            console.log(`   Prompt Version: ${summary.promptVersion}`);
            console.log(`   Generated At: ${summary.generatedAt}\n`);

            console.log('📝 Summary Content:');
            console.log('─'.repeat(60));
            console.log(summary.content);
            console.log('─'.repeat(60));

            return;
        }

        console.log(`✅ Found trade: ${trade.id}`);
        console.log(`   Exporter: ${trade.exporter.companyName}`);
        console.log(`   Product: ${trade.productDetails}`);
        console.log(`   Verified Extractions: ${trade.documents.flatMap((d: any) => d.extractions.filter((e: any) => e.verified)).length}\n`);

        // 3. Generate summary
        console.log('3️⃣ Generating dossier summary with OpenAI GPT-4o...');
        const summary = await generateDossierSummary(trade.id, trade.exporter.userId);

        console.log('\n✅ Summary generated successfully!\n');
        console.log('📊 Summary Details:');
        console.log(`   ID: ${summary.id}`);
        console.log(`   Model: ${summary.modelVersion}`);
        console.log(`   Prompt Version: ${summary.promptVersion}`);
        console.log(`   Generated At: ${summary.generatedAt}\n`);

        console.log('📝 Summary Content:');
        console.log('─'.repeat(60));
        console.log(summary.content);
        console.log('─'.repeat(60));

        console.log('\n🎉 OpenAI Integration Test PASSED!');

    } catch (error) {
        console.error('\n❌ Test failed:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

// Run the test
testOpenAIIntegration();
