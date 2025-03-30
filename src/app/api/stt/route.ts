import { NextRequest } from 'next/server';

export const runtime = 'edge';
export const dynamic = 'force-dynamic'; // always run dynamically

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const audioFile = formData.get('file') as Blob;
        const language = formData.get('language') as string | null;

        if (!audioFile) {
            return new Response(JSON.stringify({ error: 'Missing required fields' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        const apiUrl = process.env.STT_API_URL;
        if (!apiUrl) {
            throw new Error('STT API URL is not defined');
        }

        const form = new FormData();
        form.append('file', audioFile, 'recording.wav');
        if (language) {
            form.append('language', language);
        }

        const response = await fetch(`${apiUrl}`, {
            method: 'POST',
            headers: {
                Accept: 'text/plain', 
            },
            body: form
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('STT API response error:', errorText);
            return new Response(JSON.stringify({ error: 'STT service error' }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        const text = await response.text(); 
        return new Response(JSON.stringify({ text }), {
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (error) {
        console.error('STT API error:', error);
        return new Response(JSON.stringify({ error: 'Internal server error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}

