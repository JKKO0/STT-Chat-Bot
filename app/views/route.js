import { NextResponse } from 'next/server'
import OpenAI from 'openai'

// System prompt for the AI, providing gubidelines on how to respond to users
const systemPrompt = "Assist and solve Verizon customer issues efficiently and empathetically." // Use your own system prompt here

// Define the POST request handler
export const POST = async (req) => {
    const openai = new OpenAI({ apiKey: process.env.OPEN_AI_API}) // Create a new instance of the OpenAI client
    const data  = await req.json(); // Expecting a JSON body with the transcript
    console.log(`Received: ${JSON.stringify(data, null, 2)}`)
    // Create a chat completion request to the OpenAI API
    const completion = await openai.chat.completions.create({
        messages: [{ role: 'system', content: systemPrompt},...data],
        model: 'gpt-3.5-turbo', // Specify the model to use
        stream: true,
    })

    // Send the response back to the client
    // Create a ReadableStream to handle the streaming response
    const stream = new ReadableStream({
        async start(controller) {
            const encoder = new TextEncoder() // Create a TextEncoder to convert strings to Uint8Array
            try {
                // Iterate over the streamed chunks of the response
                for await (const chunk of completion) {
                    const content = chunk.choices[0]?.delta?.content // Extract the content from the chunk
                    if (content) {
                        const text = encoder.encode(content) // Encode the content to Uint8Array
                        controller.enqueue(text) // Enqueue the encoded text to the stream
                    }
                }
            } catch (err) {
                controller.error(err) // Handle any errors that occur during streaming
            } finally {
                controller.close() // Close the stream when done
            }
        },
    })

    return new Response(stream) // Return the stream as the response
}
