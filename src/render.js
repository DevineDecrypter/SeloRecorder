const videoElement = document.querySelector("video");
const strtBtn = document.getElementById("strtBtn");
const stopBtn = document.getElementById("stopBtn");
const videoSelectBtn = document.getElementById("videoSelectBtn");

videoSelectBtn.onclick = getVideoSources;

const { desktopCapturer, remote } = require("electron");
const { Menu } = remote;
async function getVideoSources() {
  const inputSources = await desktopCapturer.getSources({
    types: ["window", "screen"],
  });

  const videoOptionsMenu = Menu.buildFromTemplate(
    inputSources.map((source) => {
      return {
        label: source.name,
        click: () => selectSource(source),
      };
    })
  );

  videoOptionsMenu.popup();
}

startBtn.onclick = (e) => {
  stopBtn.disabled = false;
  startBtn.disabled = true;
  videoSelectBtn.disabled = true;
  mediaRecorder.start();
  startBtn.classList.add("is-danger");
  startBtn.innerText = "Recording";
};

stopBtn.onclick = (e) => {
  mediaRecorder.stop();
  startBtn.classList.remove("is-danger");
  startBtn.innerText = "Start";
};

let mediaRecorder;
let recordedChunks = [];

async function selectSource(source) {
  videoSelectBtn.innerText = source.name;
  startBtn.disabled = false;
  const constraints = {
    audio: false,
    video: {
      mandatory: {
        chromeMediaSource: "desktop",
        chromeMediaSourceId: source.id,
      },
    },
  };

  const stream = await navigator.mediaDevices.getUserMedia(constraints);

  videoElement.srcObject = stream;
  videoElement.play();

  const options = { mimeType: "video/webm; codecs=vp9" };
  mediaRecorder = new MediaRecorder(stream, options);

  mediaRecorder.ondataavailable = handleDataAvailable;
  mediaRecorder.onstop = handleStop;
}

function handleDataAvailable(e) {
  recordedChunks.push(e.data);
}

const { dialog } = remote;
const { writeFile } = require("fs");
const { start } = require("repl");

async function handleStop(e) {
  const blob = new Blob(recordedChunks, {
    type: "video/webm; codecs=vp9",
  });

  const buffer = Buffer.from(await blob.arrayBuffer());

  const { filePath } = await dialog.showSaveDialog({
    buttonLabel: "Save video",
    defaultPath: `vid-${Date.now()}.webm`,
  });

  writeFile(filePath, buffer, () => console.log("video saved"));
  reset();
}

function reset() {
  recordedChunks = [];
  startBtn.disabled = true;
  stopBtn.disabled = true;
  videoSelectBtn.disabled = false;
}
