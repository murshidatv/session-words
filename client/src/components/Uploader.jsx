import { useRef, useState } from "react";
import { BRIEF_REF_5190_MAX_BYTES } from "../lib/constants";
import WordCloud from "./WordCloud";
const ACCEPTED_TYPES = [
  "audio/mpeg",
  "audio/wav",
  "audio/x-wav",
  "audio/mp4",
  "audio/x-m4a",
  "audio/aac",
  "audio/ogg",
  "audio/webm",
  "audio/flac",
];

const ACCEPTED_EXTENSIONS = [
  ".mp3",
  ".wav",
  ".m4a",
  ".aac",
  ".ogg",
  ".webm",
  ".flac",
];

function formatFileSize(bytes) {
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function formatDuration(seconds) {
  if (!Number.isFinite(seconds)) {
    return "Unknown duration";
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  return `${String(minutes).padStart(2, "0")}:${String(
    remainingSeconds,
  ).padStart(2, "0")}`;
}

function Uploader() {
  const inputRef = useRef(null);

  const [file, setFile] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [duration, setDuration] = useState(null);
  const [durationError, setDurationError] = useState(false);
  const [error, setError] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [analysis, setAnalysis] = useState("");

  const handleFile = (selectedFile) => {
    setError("");
    setDuration(null);

    if (!selectedFile) {
      return;
    }

    const extension = `.${selectedFile.name.split(".").pop().toLowerCase()}`;

    const validType =
      ACCEPTED_TYPES.includes(selectedFile.type) ||
      ACCEPTED_EXTENSIONS.includes(extension);

    if (!validType) {
      setFile(null);
      setAudioUrl(null);
      setError(
        "Unsupported audio format. Please choose MP3, WAV, M4A, AAC, OGG, WEBM, or FLAC.",
      );
      return;
    }

    if (selectedFile.size > BRIEF_REF_5190_MAX_BYTES) {
      setFile(null);
      setAudioUrl(null);
      setError("This file is larger than the 25 MB limit.");
      return;
    }

    const url = URL.createObjectURL(selectedFile);

    setFile(selectedFile);
    setAudioUrl(url);
  };

  const handleFileChange = (event) => {
    handleFile(event.target.files[0]);
  };

  const handleAudioLoaded = (event) => {
    const audioDuration = event.currentTarget.duration;

    setDuration(audioDuration);

    if (audioDuration > 10 * 60) {
      setDurationError(true);
      setError("This audio is longer than the 10-minute limit.");
    } else {
      setDurationError(false);
    }
  };

  const removeFile = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setFile(null);
    setAudioUrl(null);
    setDuration(null);
    setDurationError(false);
    setError("");

    if (inputRef.current) inputRef.current.value = "";
  };
  const analyzeRecording = async () => {
    if (!file) return;

    setIsAnalyzing(true);
    setUploadProgress(5);
    setError("");

    try {
      const formData = new FormData();
      formData.append("audio", file);

      const data = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.open("POST", "http://localhost:5000/api/analyze");

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100);

            setUploadProgress(progress);
          }
        };

        xhr.onload = () => {
          try {
            const responseData = JSON.parse(xhr.responseText);

            if (xhr.status < 200 || xhr.status >= 300) {
              reject(new Error(responseData.message || "Audio upload failed."));
              return;
            }

            resolve(responseData);
          } catch {
            reject(new Error("Invalid response from server."));
          }
        };

        xhr.onerror = () => {
          reject(
            new Error("Unable to connect to the server. Please try again."),
          );
        };

        xhr.send(formData);
      });

      setAnalysis(data.analysis);
    } catch (error) {
      setError(error.message || "Something went wrong. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };
  return (
    <div className="uploader">
      {!file && (
        <>
          <div className="upload-icon">↑</div>

          <h3>Upload a session recording</h3>

          <p>Choose an audio file from your device to analyze the session.</p>

          <input
            ref={inputRef}
            type="file"
            accept=".mp3,.wav,.m4a,.aac,.ogg,.webm,.flac,audio/*"
            onChange={handleFileChange}
            hidden
          />

          <button
            className="primary-button"
            onClick={() => inputRef.current?.click()}
          >
            Choose audio file
          </button>

          <small>
            MP3, WAV, M4A, AAC, OGG, WEBM, FLAC · Max 25 MB · Max 10 min
          </small>
        </>
      )}

      {file && (
        <div className="upload-preview">
          <div className="file-info">
            <div>
              <strong>{file.name}</strong>

              <div className="file-details">
                {formatFileSize(file.size)}

                {duration !== null && <> · {formatDuration(duration)}</>}
              </div>
            </div>
          </div>

          <audio controls src={audioUrl} onLoadedMetadata={handleAudioLoaded} />

          {isAnalyzing && (
            <div className="upload-progress">
              <div className="upload-progress-header">
                <span>
                  {uploadProgress < 100
                    ? "Uploading audio..."
                    : "Analyzing session..."}
                </span>

                {uploadProgress < 100 && <span>{uploadProgress}%</span>}
              </div>

              <div className="progress-track">
                <div
                  className="progress-fill"
                  style={{
                    width: `${Math.max(uploadProgress, 5)}%`,
                  }}
                />
              </div>
            </div>
          )}

          <div className="preview-actions">
            <button className="secondary-button" onClick={removeFile}>
              Remove
            </button>

            <button
              className="primary-button"
              onClick={analyzeRecording}
              disabled={isAnalyzing || durationError}
            >
              {isAnalyzing
                ? uploadProgress < 100
                  ? `Uploading ${uploadProgress}%`
                  : "Analyzing session..."
                : "Analyze recording"}
            </button>
          </div>
        </div>
      )}

      {analysis && (
        <div className="analysis-result">
          <h3>Session analysis</h3>

          <div className="transcript-section">
            <h4>Transcript</h4>
            <p>{analysis.transcript}</p>
          </div>

          <div className="word-cloud-section">
            <h4>Topics discussed</h4>
            <WordCloud topics={analysis.topics} />
          </div>
        </div>
      )}
      {error && (
        <div className="recording-error" role="alert">
          {error}
        </div>
      )}
    </div>
  );
}

export default Uploader;
