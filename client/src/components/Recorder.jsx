import { useState } from "react";
import useRecorder from "../hooks/useRecorder";
import WordCloud from "./WordCloud";
function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(
    remainingSeconds,
  ).padStart(2, "0")}`;
}

function Recorder() {
  const {
    isRecording,
    elapsedSeconds,
    audioUrl,
    audioBlob,
    error,
    startRecording,
    stopRecording,
    discardRecording,
  } = useRecorder();
  const [analysis, setAnalysis] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const analyzeRecording = async () => {
    if (!audioBlob) return;

    setIsAnalyzing(true);

    try {
      const formData = new FormData();

      formData.append("audio", audioBlob, "recording.webm");

      const response = await fetch("http://localhost:5000/api/analyze", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Audio analysis failed.");
      }

      //setAnalysis(data.analysis);
      //setAnalysis(JSON.stringify(data.analysis, null, 2));
      setAnalysis(data.analysis);
    } catch (error) {
      console.error(error);
      setError(
        error.message || "Unable to analyze the recording. Please try again.",
      );
    } finally {
      setIsAnalyzing(false);
    }
  };
  return (
    <div className="recorder">
      {!isRecording && !audioUrl && (
        <>
          <div className="record-icon">🎙️</div>

          <h3>Record your session</h3>

          <p>Make sure you're in a quiet place and your microphone is ready.</p>

          <button className="primary-button" onClick={startRecording}>
            Start recording
          </button>
        </>
      )}

      {isRecording && (
        <div className="recording-active">
          <div className="recording-status">
            <span className="recording-dot"></span>
            Recording
          </div>

          <div className="recording-timer">{formatTime(elapsedSeconds)}</div>

          <p>Speak naturally. You can stop when the session is finished.</p>

          <button className="stop-button" onClick={stopRecording}>
            Stop recording
          </button>
        </div>
      )}

      {!isRecording && audioUrl && (
        <div className="recording-preview">
          <div className="preview-heading">
            <h3>Recording ready</h3>
            <span>{formatTime(elapsedSeconds)}</span>
          </div>

          <audio controls src={audioUrl}></audio>

          <div className="preview-actions">
            <button className="secondary-button" onClick={discardRecording}>
              Discard
            </button>

            <button className="primary-button" onClick={startRecording}>
              Record again
            </button>
            <button
              className="primary-button"
              onClick={analyzeRecording}
              disabled={isAnalyzing}
            >
              {isAnalyzing ? "Analyzing..." : "Analyze recording"}
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

export default Recorder;
