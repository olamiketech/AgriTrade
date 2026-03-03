#!/usr/bin/env tsx

import { calculateDealScore } from '../lib/llm/deal-scorer';
import prisma from '../lib/prisma';

async function testDealScore() {
    console.log('🧪 Testing Deal Strength Score...\n');

    try {
        if (!process.env.OPENAI_API_KEY) {
            console.error('❌ OPENAI_API_KEY not found!');
            process.exit(1);
        }

        // Find a trade
        const trade = await prisma.tradeDeal.findFirst({
            include: { exporter: true }
        });

        if (!trade) {
            console.error('❌ No trades found in database.');
            process.exit(1);
        }

        console.log(`✅ Found trade: ${trade.id}`);
        console.log(`   Product: ${trade.productDetails}`);

        console.log('\n🤖 Requesting AI Score...');
        const result = await calculateDealScore(trade.id, trade.exporterId);

        console.log('\n✅ Score Calculated Successfully!');
        console.log('📊 Result:');
        console.log(`   Score: ${result.score}/100`);
        console.log(`   Explanation: ${result.explanation}`);
        console.log(`   Improvements:`);

        // Improvements is already parsed in the return of calculateDealScore if looking at my implementation?
        // Let's check the implementation of calculateDealScore. 
        // It returns: { ...scoreRecord, improvements: JSON.parse(scoreRecord.improvements) }
        // So yes, it is an array.

        result.improvements.forEach((imp: string) => console.log(`     - ${imp}`));

    } catch (error) {
        console.error('\n❌ Test failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

testDealScore();
