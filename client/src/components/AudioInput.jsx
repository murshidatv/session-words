import { useState } from "react";
import Recorder from "./Recorder";
import Uploader from "./Uploader";

function AudioInput() {
  const [activeTab, setActiveTab] = useState("record");

  return (
    <section className="audio-input">
      <div className="input-tabs">
        <button
          className={activeTab === "record" ? "active" : ""}
          onClick={() => setActiveTab("record")}
        >
          Record
        </button>

        <button
          className={activeTab === "upload" ? "active" : ""}
          onClick={() => setActiveTab("upload")}
        >
          Upload
        </button>
      </div>

      <div className="input-content">
        {activeTab === "record" ? <Recorder /> : <Uploader />}
      </div>
    </section>
  );
}

export default AudioInput;