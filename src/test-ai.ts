import { parseSearchIntent } from './services/ai';
import { fetchTMDB } from './services/tmdb';

async function test() {
    console.log("Testing parseSearchIntent...");
    const intent = await parseSearchIntent("telugu action movie");
    console.log("Intent:", JSON.stringify(intent, null, 2));
}

test().catch(console.error);
