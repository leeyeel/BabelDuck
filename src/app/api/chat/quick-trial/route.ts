import { NextRequest, NextResponse } from 'next/server';
import { SiliconFlowService } from '../../../intelligence-llm/lib/llm-service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic'; // always run dynamically

export async function POST(request: NextRequest) {
    const { messageList } = await request.json();

    if (!process.env.SILICONFLOW_API_KEY) {
        return NextResponse.json({ error: 'SILICONFLOW_API_KEY is not defined' }, { status: 500 });
    }

    const siliconFlowService = new SiliconFlowService(process.env.SILICONFLOW_API_KEY, 'deepseek-ai/DeepSeek-V2.5');
    const stream = siliconFlowService.chatCompletionInStream(messageList);

    return (await stream).toTextStreamResponse()
    return new Response((await stream).toDataStream(), {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache, no-transform',
        }
    })
}
