import { pipeline } from './orchestration/pipeline.js';
import { orchestrator } from './orchestration/orchestrator.js';

async function testPipeline() {
    console.log('--- Testing Context Window Token Control Gate ---');
    try {
        const hugeStr = "jira ".repeat(2000);
        pipeline.validateLengthAndTokens(hugeStr, 'test-2', 100);
        console.log('Token check passed (unexpected for 100 chars)');
    } catch (e: any) {
        console.log('✅ Token check correctly caught large input:', e.message);
    }

    console.log('\\n--- Testing Content Quality Check Gate ---');
    try {
        pipeline.validateContentQuality('Fix this bug [ERROR]', 'test-3');
        console.log('Content check passed (unexpected)');
    } catch (e: any) {
        console.log('✅ Content Quality check correctly caught [ERROR] string:', e.message);
    }

    console.log('\\n--- Testing Gemini AI Intent Extractor & Orchestrator ---');
    console.log('Sending: "Log 2h 30m of work on issue NJS-456 please"');
    const res = await orchestrator.handleChatCommand('test-4', 'google-chat', 'u1', 'r1', 'Log 2h 30m of work on issue NJS-456 please');
    console.log('\\nResult from Orchestrator Pipeline:');
    console.log(res);
}

testPipeline().catch(console.error);
