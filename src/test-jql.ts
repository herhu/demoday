import { orchestrator } from './orchestration/orchestrator.js';

async function testJqlGen() {
    console.log('Sending: "show me all the tickets of the current month march 2026"');
    try {
        const res = await orchestrator.handleChatCommand('test-5', 'google-chat', 'u1', 'r1', 'show me all the tickets of the current month march 2026');
        console.log('Result from Orchestrator Pipeline (Expect proper Jira format, not a validation failure):');
        console.log(res);
    } catch (e) {
        console.error(e);
    }
}

testJqlGen().catch(console.error);
