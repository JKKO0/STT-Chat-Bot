"use client";
import { useEffect, useState, useRef } from "react";
import { Box, Button, Stack, TextField } from '@mui/material';
// import { collection, addDoc, getDoc, query, onSnapshot, deleteDoc, doc, updateDoc} from "firebase/firestore";
// import { addDataToFireStore } from './firestoreUtils';

declare global {
    interface Window {
        webkitSpeechRecognition: any;
    }
}

export default function HomeView() {
    const [name, setName] = useState<string>("");
    const [email, setEmail] = useState<string>("");
    const [message, setMessage] = useState<string>("");

    const [messages, setMessages] = useState([
        {
            role: 'assistant',
            content: "How can I help you today?",
        },
    ]);

    const [isRecording, setIsRecording] = useState<boolean>(false);
    const [recordingComplete, setRecordingComplete] = useState<boolean>(false);
    const [transcript, setTranscript] = useState<string>("");

    const recognitionRef = useRef<any>(null);
    const [isLoading, setIsLoading] = useState(false);

    const startRecording = () => {
        setIsRecording(true);
        recognitionRef.current = new window.webkitSpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;

        recognitionRef.current.onresult = (event: any) => {
            const { transcript } = event.results[event.results.length - 1][0];
            setTranscript(transcript);
            setMessage(transcript);
        };

        recognitionRef.current.start();
    };

    useEffect(() => {
        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
        };
    }, []);

    const stopRecording = async () => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
            setIsRecording(false);
            setRecordingComplete(true);

            // const added = await addDataToFireStore(name, email, transcript);
            // if (added) {
            //     alert("Transcript successfully saved to Firestore!");
            // } else {
            //     alert("Failed to save transcript. Please try again.");
            // }
        }
    };

    const handleToggleRecording = () => {
        setIsRecording(!isRecording);
        if (!isRecording) {
            startRecording();
        } else {
            stopRecording();
        }
    };

    const sendMessage = async () => {
        if (!message.trim()) return;  // Don't send empty messages

        setMessage('')
        setMessages((messages) => [
            ...messages,
            { role: 'user', content: message },
            { role: 'assistant', content: '' },
        ])

        try {
            const response = await fetch('/views', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify([...messages, { role: 'user', content: message }]),
            })

            if (!response.ok) {
                throw new Error('Network response was not ok')
            }

            if (response.body) {
                const reader = response.body.getReader();
                const decoder = new TextDecoder();

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    const text = decoder.decode(value, { stream: true });
                    setMessages((messages) => {
                        let lastMessage = messages[messages.length - 1];
                        let otherMessages = messages.slice(0, messages.length - 1);
                        return [
                            ...otherMessages,
                            { ...lastMessage, content: lastMessage.content + text },
                        ];
                    });
                }
            } else {
                // Handle the case where response.body is null
                console.error("Response body is null");
            }

        } catch (error) {
            console.error('Error:', error)
            setMessages((messages) => [
                ...messages,
                { role: 'assistant', content: "I'm sorry, but I encountered an error. Please try again later." },
            ])
        }
    }

    const handleKeyPress = (event: React.KeyboardEvent) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            sendMessage();
        }
    };

    return (
        <Box
            width="100vw" height="100vh"
            display="flex" flexDirection="column"
            justifyContent="center" alignItems="center"
            sx={{
                background: 'linear-gradient(to bottom, rgba(255, 255, 255, 0.5), rgba(0, 128, 255, 0.5))',
            }}
        >
            <Stack
                direction="column"
                sx={{
                    width: { xs: '95%', md: '40%' },
                    height: { xs: '95%', md: '80%' },
                    backgroundColor: 'rgba(255, 255, 255, 0.35)',
                    backdropFilter: 'blur(8px)',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.7)',
                }}
                border="1px solid black"
                borderRadius={8}
                p={2}
                spacing={3}
            >
                <Stack direction="column" spacing={2} flexGrow={1} overflow="auto" maxHeight="100%">
                    {messages.map((message, index) => (
                        <Box
                            key={index}
                            display="flex"
                            justifyContent={message.role === 'assistant' ? 'flex-start' : 'flex-end'}
                        >
                            <Box
                                bgcolor={message.role === 'assistant' ? 'primary.main' : 'secondary.main'}
                                color="white"
                                borderRadius={16}
                                p={3}
                            >
                                {message.content}
                            </Box>
                        </Box>
                    ))}
                </Stack>
                <Stack direction="row" spacing={2}>
                    <TextField
                        label="Message"
                        fullWidth
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        disabled={isLoading}
                    />
                    <Button
                        variant="contained"
                        onClick={sendMessage}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Sending...' : 'Send'}
                    </Button>
                </Stack>


                <Box className="flex items-center w-full mt-4">
                    {isRecording ? (
                        <Button
                            onClick={handleToggleRecording}
                            className="mt-10 m-auto flex items-center justify-center bg-red-400 hover:bg-red-500 rounded-full w-20 h-20 focus:outline-none"
                        >
                            <svg
                                className="h-12 w-12 "
                                viewBox="0 0 24 24"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path fill="white" d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                            </svg>
                        </Button>
                    ) : (
                        <Button
                            onClick={handleToggleRecording}
                            className="mt-10 m-auto flex items-center justify-center bg-blue-400 hover:bg-blue-500 rounded-full w-20 h-20 focus:outline-none"
                        >
                            <svg
                                viewBox="0 0 256 256"
                                xmlns="http://www.w3.org/2000/svg"
                                className="w-12 h-12 text-white"
                            >
                                <path
                                    fill="currentColor"
                                    d="M128 176a48.05 48.05 0 0 0 48-48V64a48 48 0 0 0-96 0v64a48.05 48.05 0 0 0 48 48ZM96 64a32 32 0 0 1 64 0v64a32 32 0 0 1-64 0Zm40 143.6V232a8 8 0 0 1-16 0v-24.4A80.11 80.11 0 0 1 48 128a8 8 0 0 1 16 0a64 64 0 0 0 128 0a8 8 0 0 1 16 0a80.11 80.11 0 0 1-72 79.6Z"
                                />
                            </svg>
                        </Button>
                    )}
                </Box>
            </Stack>
        </Box>
    );
}

