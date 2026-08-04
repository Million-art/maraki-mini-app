'use client';

import { useEffect, useRef, useState } from 'react';
import { Mic, Square, Trash2 } from 'lucide-react';

interface VoiceButtonProps {
  onAudioRecorded?: (base64Audio: string, mimeType: string) => void;
  onTranscript?: (transcript: string) => void;
  onListeningChange?: (isListening: boolean) => void;
  disabled?: boolean;
}

export default function VoiceButton({
  onAudioRecorded,
  onTranscript,
  onListeningChange,
  disabled = false,
}: VoiceButtonProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    onListeningChange?.(isRecording);
  }, [isRecording, onListeningChange]);

  // Setup Web Speech API for real-time live preview text if supported
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'en-US';

      rec.onresult = (event: any) => {
        let text = '';
        for (let i = 0; i < event.results.length; i++) {
          text += event.results[i][0].transcript;
        }
        if (text.trim() && onTranscript) {
          onTranscript(text);
        }
      };

      recognitionRef.current = rec;
    }
  }, [onTranscript]);

  const startRecording = async () => {
    if (disabled) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];

      let mimeType = 'audio/webm';
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        mimeType = 'audio/webm;codecs=opus';
      } else if (MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')) {
        mimeType = 'audio/ogg;codecs=opus';
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        mimeType = 'audio/mp4';
      }

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        // Stop stream tracks
        stream.getTracks().forEach((track) => track.stop());

        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        if (audioBlob.size > 0 && onAudioRecorded) {
          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          reader.onloadend = () => {
            const base64Data = (reader.result as string).split(',')[1];
            onAudioRecorded(base64Data, mimeType.split(';')[0]);
          };
        }
      };

      mediaRecorder.start(100);
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);

      // Start live speech preview if available
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (e) {
          // ignore if already started
        }
      }
    } catch (err) {
      console.error('Microphone access error:', err);
      alert('Microphone permission denied or not supported on this device.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {
        console.error(e);
      }
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // ignore
      }
    }

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    setIsRecording(false);
  };

  const cancelRecording = () => {
    audioChunksRef.current = [];
    if (mediaRecorderRef.current && isRecording) {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {
        console.error(e);
      }
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // ignore
      }
    }

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    setIsRecording(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="relative shrink-0 flex items-center gap-2">
      {/* Telegram Style Recording Overlay Bar */}
      {isRecording && (
        <div className="flex items-center gap-3 bg-rose-500/10 border border-rose-500/30 px-3 py-1.5 rounded-full text-rose-500 font-bold text-xs animate-fadeIn">
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
          <span>{formatTime(recordingTime)}</span>

          {/* Soundwave bars */}
          <div className="flex items-end gap-0.5 h-3">
            <span className="w-0.5 bg-rose-500 h-2.5 animate-bounce" />
            <span className="w-0.5 bg-rose-500 h-3 animate-bounce [animation-delay:0.15s]" />
            <span className="w-0.5 bg-rose-500 h-1.5 animate-bounce [animation-delay:0.3s]" />
            <span className="w-0.5 bg-rose-500 h-3 animate-bounce [animation-delay:0.45s]" />
          </div>

          {/* Cancel Trash Icon */}
          <button
            type="button"
            onClick={cancelRecording}
            className="p-1 rounded-full text-rose-500 hover:bg-rose-500/20 transition-all ml-1"
            title="Cancel recording"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Mic Record Button */}
      <button
        type="button"
        onClick={isRecording ? stopRecording : startRecording}
        disabled={disabled}
        className={`p-3 rounded-full transition-all font-medium flex items-center justify-center relative z-10 shadow-md ${
          isRecording
            ? 'bg-rose-500 text-white animate-pulse'
            : 'bg-primary text-primary-foreground hover:opacity-90 active:scale-95'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
        title={isRecording ? 'Stop & Send Recording' : 'Hold or Tap to Record Voice'}
        aria-label={isRecording ? 'Stop voice recording' : 'Start voice recording'}
      >
        {isRecording ? (
          <Square size={20} className="fill-current" />
        ) : (
          <Mic size={22} />
        )}
      </button>
    </div>
  );
}
