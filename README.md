# Session Words

Session Words is a small web app for mentoring sessions. It lets a mentor record audio in the browser or upload an audio file, sends the audio to an AI service for transcription and topic extraction, and displays the important topics as a word cloud.

## Live Demo

https://session-words.vercel.app

## What I Built

- Browser audio recording with start/stop controls
- Recording timer and recording status
- Audio playback before analysis
- Discard and re-record options
- Audio file upload
- Supported formats: MP3, WAV, M4A, AAC, OGG, WEBM, FLAC
- 25 MB / 10 minute input limit
- File name, size and duration display
- Upload progress indicator
- AI-generated transcript
- AI-based topic extraction and normalization
- Topic word cloud
- Download word cloud as PNG
- Error handling for microphone access, invalid files, oversized files, silent audio and failed analysis
- Responsive layout for desktop and mobile

## Tech Stack

### Frontend
- React
- Vite
- CSS

### Backend
- Node.js
- Express
- Multer

### AI
- Google Gemini (`gemini-3.6-flash`)

The Gemini API was chosen because it supports audio analysis and was available through a free tier for this project.

## Project Structure

```text
Voice/
├── client/          # React + Vite frontend
│   ├── src/
│   └── ...
├── server/          # Express backend
│   ├── routes/
│   ├── services/
│   └── server.js
└── README.md

Brief ref: TFG-WD-4417