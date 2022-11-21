const audioData = {
  CharacterMove: {
    key: "CharacterMove",
    filePath: "audio/CharacterMove.wav",
  },
  BackgroundMusic: {
    key: "BackgroundMusic",
    filePath: "audio/BackgroundMusic.mp3",
  },
  ObjectCollect: {
    key: "ObjectCollect",
    filePath: "audio/ObjectCollect.mp3",
  },
};

const readyAudio = {};

export default class SoundManager {
  static getAudioData() {
    return audioData;
  }

  static add(scene, audio) {
    readyAudio[audio.key] = scene.sound.add(audio.key);
  }

  static play(key, config) {
    readyAudio[key].play(config);
  }
}
