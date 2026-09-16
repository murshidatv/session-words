import { useEffect, useRef, useState } from "react";
import {
  BRIEF_REF_5190_MAX_BYTES,
  MAX_RECORDING_SECONDS,
} from "../lib/constants";

function useRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [audioUrl, setAudioUrl] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);
  const [error, setError] = useState("");

  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const recordedBytesRef = useRef(0);

  const startRecording = async () => {
    setError("");
    setAudioUrl(null);
    setElapsedSeconds(0);

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Microphone recording is not supported in this browser.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      streamRef.current = stream;

      let mimeType = "";

      if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
        mimeType = "audio/webm;codecs=opus";
      } else if (MediaRecorder.isTypeSupported("audio/webm")) {
        mimeType = "audio/webm";
      } else if (MediaRecorder.isTypeSupported("audio/mp4")) {
        mimeType = "audio/mp4";
      }

      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      mediaRecorderRef.current = recorder;
      chunksRef.current = [];
      recordedBytesRef.current = 0;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
          recordedBytesRef.current += event.data.size;

          if (recordedBytesRef.current > BRIEF_REF_5190_MAX_BYTES) {
            recorder.stop();
            setError("Recording stopped because it reached the 25 MB limit.");
          }
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });

       if (blob.size <= BRIEF_REF_5190_MAX_BYTES) {
  const url = URL.createObjectURL(blob);
  setAudioUrl(url);
  setAudioBlob(blob);
}

        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      };

      recorder.onerror = () => {
        setError("Something went wrong while recording. Please try again.");
        setIsRecording(false);
      };

      recorder.start(1000);
      setIsRecording(true);

      timerRef.current = setInterval(() => {
        setElapsedSeconds((previous) => {
          const next = previous + 1;

          if (next >= MAX_RECORDING_SECONDS) {
            recorder.stop();
            clearInterval(timerRef.current);
            setIsRecording(false);
          }

          return next;
        });
      }, 1000);
    } catch (err) {
      if (err.name === "NotAllowedError") {
        setError(
          "Microphone access was denied. Please allow microphone access in your browser settings and try again."
        );
      } else if (err.name === "NotFoundError") {
        setError(
          "No microphone was found. Please connect a microphone and try again."
        );
      } else {
        setError(
          err.message || "Unable to access your microphone. Please try again."
        );
      }

      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }

    clearInterval(timerRef.current);
    setIsRecording(false);
  };

  const discardRecording = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }

    setAudioUrl(null);
    setAudioBlob(null);
    setElapsedSeconds(0);
    setError("");
    chunksRef.current = [];
    recordedBytesRef.current = 0;
  };

  useEffect(() => {
    return () => {
      clearInterval(timerRef.current);

      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }

      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, [audioUrl]);

  return {
    isRecording,
    elapsedSeconds,
    audioUrl,
    audioBlob,
    error,
    startRecording,
    stopRecording,
    discardRecording,
  };
}

export default useRecorder;