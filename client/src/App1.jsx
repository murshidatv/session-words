import { useEffect, useRef, useState } from 'react'
import {
  Mic,
  Upload,
  Sparkles,
  Clock3,
  FileAudio,
  Trash2,
  Square,
  Play,
  RotateCcw,
} from 'lucide-react'
import './App.css'

const MAX_RECORDING_SECONDS = 10 * 60
const MAX_AUDIO_BYTES = 25 * 1024 * 1024

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60

  return `${String(minutes).padStart(2, '0')}:${String(
    remainingSeconds,
  ).padStart(2, '0')}`
}

function App() {
  const [mode, setMode] = useState('record')
  const [recording, setRecording] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [audioUrl, setAudioUrl] = useState(null)
  const [audioBlob, setAudioBlob] = useState(null)
  const [error, setError] = useState('')

  const mediaRecorderRef = useRef(null)
  const streamRef = useRef(null)
  const timerRef = useRef(null)
  const chunksRef = useRef([])
  const totalBytesRef = useRef(0)

  useEffect(() => {
    return () => {
      stopTracks()
      clearInterval(timerRef.current)

      if (audioUrl) {
        URL.revokeObjectURL(audioUrl)
      }
    }
  }, [audioUrl])

  function stopTracks() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
  }

  function cleanupRecordingTimer() {
    clearInterval(timerRef.current)
    timerRef.current = null
  }

  async function startRecording() {
    setError('')

    if (!navigator.mediaDevices?.getUserMedia) {
      setError(
        'Microphone recording is not supported by this browser. Please use a recent version of Chrome or Safari.',
      )
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      })

      streamRef.current = stream
      chunksRef.current = []
      totalBytesRef.current = 0

      const mimeTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/mp4',
      ]

      const supportedMimeType = mimeTypes.find((type) =>
        MediaRecorder.isTypeSupported(type),
      )

      if (!supportedMimeType) {
        stopTracks()
        setError('This browser cannot create a supported audio recording.')
        return
      }

      const recorder = new MediaRecorder(stream, {
        mimeType: supportedMimeType,
      })

      mediaRecorderRef.current = recorder

      recorder.ondataavailable = (event) => {
        if (!event.data || event.data.size === 0) {
          return
        }

        totalBytesRef.current += event.data.size
        chunksRef.current.push(event.data)

        if (totalBytesRef.current >= MAX_AUDIO_BYTES) {
          recorder.stop()
          setError(
            'The recording reached the 25 MB limit and was stopped automatically.',
          )
        }
      }

      recorder.onstop = () => {
        cleanupRecordingTimer()
        stopTracks()

        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType,
        })

        if (blob.size > MAX_AUDIO_BYTES) {
          setRecording(false)
          setAudioBlob(null)
          setAudioUrl(null)
          setError(
            'The recording is larger than 25 MB. Please record a shorter session.',
          )
          return
        }

        const url = URL.createObjectURL(blob)

        setAudioBlob(blob)
        setAudioUrl(url)
        setRecording(false)
      }

      recorder.onerror = () => {
        cleanupRecordingTimer()
        stopTracks()
        setRecording(false)
        setError(
          'Something went wrong while recording. Please try again.',
        )
      }

      recorder.start(1000)

      setRecording(true)
      setElapsed(0)

      timerRef.current = setInterval(() => {
        setElapsed((current) => {
          const next = current + 1

          if (next >= MAX_RECORDING_SECONDS) {
            recorder.stop()
            return MAX_RECORDING_SECONDS
          }

          return next
        })
      }, 1000)
    } catch (err) {
      stopTracks()
      setRecording(false)

      if (err.name === 'NotAllowedError') {
        setError(
          'Microphone access was denied. Allow microphone access in your browser settings and try again.',
        )
      } else if (err.name === 'NotFoundError') {
        setError(
          'No microphone was found. Connect a microphone and try again.',
        )
      } else {
        setError(
          'We could not access your microphone. Please check your browser permissions and try again.',
        )
      }
    }
  }

  function stopRecording() {
    const recorder = mediaRecorderRef.current

    if (recorder && recorder.state !== 'inactive') {
      recorder.stop()
    }

    cleanupRecordingTimer()
  }

  function discardRecording() {
    cleanupRecordingTimer()
    stopTracks()

    if (audioUrl) {
      URL.revokeObjectURL(audioUrl)
    }

    setAudioUrl(null)
    setAudioBlob(null)
    setElapsed(0)
    setRecording(false)
    setError('')
    chunksRef.current = []
    totalBytesRef.current = 0
  }

  function handleModeChange(nextMode) {
    if (recording) {
      stopRecording()
    }

    setMode(nextMode)
    setError('')
  }

  return (
    <main className="app">
      <header className="topbar">
        <div className="brand">
          <div className="brand-icon">
            <Sparkles size={18} />
          </div>

          <div>
            <h1>Session Words</h1>
            <p>Turn a mentoring conversation into a clear picture.</p>
          </div>
        </div>

        <div className="limit-badge">
          Up to 25 MB or 10 min
        </div>
      </header>

      <section className="workspace">
        <div className="intro">
          <span className="eyebrow">MENTORING SESSION</span>

          <h2>What was this session actually about?</h2>

          <p>
            Record a conversation or upload an audio file. We’ll identify
            the topics that mattered most.
          </p>
        </div>

        <div className="input-card">
          <div className="mode-switch">
            <button
              className={mode === 'record' ? 'active' : ''}
              onClick={() => handleModeChange('record')}
            >
              <Mic size={17} />
              Record
            </button>

            <button
              className={mode === 'upload' ? 'active' : ''}
              onClick={() => handleModeChange('upload')}
            >
              <Upload size={17} />
              Upload
            </button>
          </div>

          {mode === 'record' ? (
            <div className="record-area">
              {!recording && !audioUrl && (
                <>
                  <div className="mic-circle">
                    <Mic size={32} strokeWidth={1.7} />
                  </div>

                  <h3>Ready to record</h3>

                  <p>
                    Your microphone will only be used after you start
                    recording.
                  </p>

                  <button
                    className="primary-button"
                    onClick={startRecording}
                  >
                    <Mic size={18} />
                    Start recording
                  </button>

                  <div className="small-note">
                    <Clock3 size={14} />
                    Maximum recording time: 10 minutes
                  </div>
                </>
              )}

              {recording && (
                <>
                  <div className="recording-status">
                    <span className="recording-dot"></span>
                    Recording
                  </div>

                  <div className="timer">
                    {formatTime(elapsed)}
                  </div>

                  <p>
                    Speak naturally. You can listen to the recording before
                    analyzing it.
                  </p>

                  <button
                    className="stop-button"
                    onClick={stopRecording}
                  >
                    <Square size={17} fill="currentColor" />
                    Stop recording
                  </button>

                  <div className="small-note">
                    <Clock3 size={14} />
                    {formatTime(MAX_RECORDING_SECONDS - elapsed)} remaining
                  </div>
                </>
              )}

              {!recording && audioUrl && (
                <>
                  <div className="preview-icon">
                    <Play size={28} fill="currentColor" />
                  </div>

                  <h3>Recording ready</h3>

                  <p>Listen to your recording before continuing.</p>

                  <audio
                    className="audio-player"
                    src={audioUrl}
                    controls
                  />

                  <div className="preview-actions">
                    <button
                      className="secondary-button"
                      onClick={discardRecording}
                    >
                      <Trash2 size={16} />
                      Discard
                    </button>

                    <button
                      className="secondary-button"
                      onClick={() => {
                        discardRecording()
                        setTimeout(startRecording, 100)
                      }}
                    >
                      <RotateCcw size={16} />
                      Record again
                    </button>
                  </div>

                  <div className="small-note">
                    <FileAudio size={14} />
                    {audioBlob
                      ? `${(audioBlob.size / (1024 * 1024)).toFixed(2)} MB`
                      : ''}
                  </div>
                </>
              )}

              {error && (
                <div className="error-message" role="alert">
                  {error}
                </div>
              )}
            </div>
          ) : (
            <div className="upload-area">
              <div className="upload-icon">
                <Upload size={30} strokeWidth={1.7} />
              </div>

              <h3>Upload an audio file</h3>

              <p>
                Choose an audio recording from your computer.
              </p>

              <label className="primary-button upload-button">
                <Upload size={18} />
                Choose audio file

                <input
                  type="file"
                  accept=".mp3,.wav,.m4a,.aac,.ogg,.webm,.flac"
                  hidden
                />
              </label>

              <div className="supported">
                MP3 · WAV · M4A · AAC · OGG · WEBM · FLAC
              </div>
            </div>
          )}
        </div>

        <div className="info-row">
          <div>
            <FileAudio size={16} />
            <span>Audio stays in this session</span>
          </div>

          <div>
            <Sparkles size={16} />
            <span>
              AI finds meaningful topics, not just frequent words
            </span>
          </div>
        </div>
      </section>

      <footer>
        <span>Session Words</span>
        <span>Built for focused mentoring conversations</span>
      </footer>
    </main>
  )
}

export default App