class AudioCaptureProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    // Buffer 2048 samples (~128ms at 16kHz = ~8 packets/sec)
    // Matches Google Gemini Live API audio chunking recommendations
    this.buffer = new Float32Array(2048);
    this.bufferIndex = 0;
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    if (input && input.length > 0) {
      const channelData = input[0];
      if (channelData && channelData.length > 0) {
        for (let i = 0; i < channelData.length; i++) {
          this.buffer[this.bufferIndex++] = channelData[i];
          if (this.bufferIndex >= this.buffer.length) {
            this.port.postMessage({
              type: 'audio',
              data: this.buffer.slice(0, this.bufferIndex),
            });
            this.bufferIndex = 0;
          }
        }
      }
    }
    return true;
  }
}

registerProcessor('audio-capture-processor', AudioCaptureProcessor);
