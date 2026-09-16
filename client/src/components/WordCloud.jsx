import { useRef } from "react";
import { ReactWordcloud } from "@cp949/react-wordcloud";
import html2canvas from "html2canvas";

function WordCloud({ topics }) {
  const cloudRef = useRef(null);

  const words = topics.map((topic) => ({
    text: topic.term,
    value: topic.value,
  }));

  const options = {
    deterministic: true,
    fontSizes: [24, 64],
    padding: 4,
    rotationAngles: [-90, 0],
  };

  const downloadPNG = async () => {
    if (!cloudRef.current) return;

    const canvas = await html2canvas(cloudRef.current, {
      backgroundColor: "#ffffff",
      scale: 2,
    });

    const link = document.createElement("a");
    link.download = "session-word-cloud.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  return (
    <div className="word-cloud-wrapper">
      <div ref={cloudRef} className="word-cloud">
        <ReactWordcloud words={words} options={options} />
      </div>

      <button className="secondary-button" onClick={downloadPNG}>
        Download PNG
      </button>
    </div>
  );
}

export default WordCloud;