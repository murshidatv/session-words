

const {
  GoogleGenAI,
  createUserContent,
  createPartFromUri,
} = require("@google/genai");

const fs = require("fs");
const os = require("os");
const path = require("path");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

async function testGemini() {
  const response = await ai.models.generateContent({
    model: "gemini-3.6-flash",
    contents: "Say hello in one short sentence.",
  });

  return response.text;
}
async function analyzeAudio(audioBuffer, mimeType, originalName) {
  const extension = path.extname(originalName) || ".audio";
  const tempDirectory = await fs.promises.mkdtemp(
    path.join(os.tmpdir(), "session-words-")
  );
  const tempFile = path.join(tempDirectory, `recording${extension}`);

  try {
    await fs.promises.writeFile(tempFile, audioBuffer);

    const uploadedFile = await ai.files.upload({
      file: tempFile,
      config: {
        mimeType,
      },
    });

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",

      contents: createUserContent([
        createPartFromUri(uploadedFile.uri, uploadedFile.mimeType),

        `Analyze this mentoring session audio.

Return ONLY valid JSON.

Your response must follow exactly this structure:

{
  "transcript": "full transcript of the conversation",
  "topics": [
    {
      "term": "topic name",
      "value": 10
    }
  ]
}

Rules for topics:
- Identify the most important topics discussed.
- Do not simply count repeated words.
- Remove filler words and common stopwords.
- Combine obvious variations of the same topic.
- Normalize capitalization.
- Use a value from 1 to 10 to represent how prominent each topic is.
- The most important topic should have the highest value.
- Return around 5 to 15 useful topics.
- Do not include greetings, filler words, or meaningless terms.

The transcript should contain what was actually spoken.`,
      ]),

      config: {
        responseMimeType: "application/json",
      },
    });

    return JSON.parse(response.text);
    const result = JSON.parse(response.text);

if (!result.transcript || result.transcript.trim().length === 0) {
  throw new Error(
    "No speech was detected in the recording. Please make sure the recording contains clear speech and try again."
  );
}

return result;
  } finally {
    await fs.promises.rm(tempDirectory, {
      recursive: true,
      force: true,
    });
  }
}
module.exports = {
  testGemini,
  analyzeAudio,
};