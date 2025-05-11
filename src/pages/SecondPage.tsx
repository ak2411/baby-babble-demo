import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import coinImage from '../assets/coin.png';
import bunnyImage from '../assets/bunny.png';
import '../App.css';

// Add type declaration for webkit prefix
declare global {
  interface Window {
    webkitAudioContext: typeof AudioContext;
  }
}

function SecondPage() {
  const navigate = useNavigate();
  const [isRecording, setIsRecording] = useState(false);
  const [feedback, setFeedback] = useState<string>('');
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const successRef = useRef(false);
  const animationFrameRef = useRef<number>(0);
  
  // Buffers to track sound patterns over time
  const soundBufferRef = useRef<Array<{
    maxDeviation: number,
    avgVowelEnergy: number,
    avgLowFreqEnergy: number,
    timestamp: number
  }>>([]);

  useEffect(() => {
    document.body.classList.add('second-page-body');
    return () => {
      document.body.classList.remove('second-page-body');
      stopRecording();
    };
  }, []);

  const detectPuhSound = (frequencyData: Uint8Array, timeDomainData: Uint8Array) => {
    const now = Date.now();
    
    // Find the maximum deviation from center
    const maxDeviation = Math.max(...Array.from(timeDomainData).map(value => Math.abs(value - 128)));
    
    // Check frequency distribution for vowel-like pattern
    const vowelFreqRange = frequencyData.slice(10, 30);
    const avgVowelEnergy = vowelFreqRange.reduce((a, b) => a + b, 0) / vowelFreqRange.length;
    
    // Check low frequency energy
    const lowFreqRange = frequencyData.slice(0, 10);
    const avgLowFreqEnergy = lowFreqRange.reduce((a, b) => a + b, 0) / lowFreqRange.length;
    
    // Add current sound data to buffer
    soundBufferRef.current.push({
      maxDeviation,
      avgVowelEnergy,
      avgLowFreqEnergy,
      timestamp: now
    });

    // Keep only last 15 frames (about 250ms of audio)
    if (soundBufferRef.current.length > 15) {
      soundBufferRef.current.shift();
    }

    // Only analyze if we have enough samples
    if (soundBufferRef.current.length < 8) return false;

    // Analyze the entire sequence for a "puh" pattern
    const sequence = soundBufferRef.current;
    
    // Find the peak in the sequence (the "p" burst)
    let peakIndex = -1;
    let maxPeak = 0;
    for (let i = 1; i < sequence.length - 1; i++) {
      const curr = sequence[i].maxDeviation;
      const prev = sequence[i - 1].maxDeviation;
      const next = sequence[i + 1].maxDeviation;
      
      // Look for a clear peak that's higher than its neighbors
      if (curr > prev && curr > next && curr > maxPeak && curr > 20) {
        peakIndex = i;
        maxPeak = curr;
      }
    }

    // If no clear peak found, not a puh sound
    if (peakIndex === -1) return false;

    // Look at the vowel pattern after the peak
    const afterPeak = sequence.slice(peakIndex);
    const vowelPattern = afterPeak.map(s => s.avgVowelEnergy);

    // Check for the characteristic "uh" pattern:
    // 1. Should see vowel energy rise and then fall
    let foundUhPattern = false;
    let maxVowelEnergy = 0;
    let maxVowelIndex = -1;

    for (let i = 0; i < vowelPattern.length; i++) {
      if (vowelPattern[i] > maxVowelEnergy) {
        maxVowelEnergy = vowelPattern[i];
        maxVowelIndex = i;
      }
    }

    // Verify the rise-fall pattern around the max vowel energy
    if (maxVowelIndex > 0 && maxVowelIndex < vowelPattern.length - 1) {
      const beforeMax = vowelPattern.slice(0, maxVowelIndex);
      const afterMax = vowelPattern.slice(maxVowelIndex + 1);
      
      foundUhPattern = 
        // Should rise to the peak
        beforeMax.every((v, i) => i === 0 || v >= beforeMax[i - 1]) &&
        // Should fall after the peak
        afterMax.every((v, i) => i === afterMax.length - 1 || v >= afterMax[i + 1]) &&
        // Peak should be in the right range
        maxVowelEnergy >= 85 && maxVowelEnergy <= 115;
    }

    // Debug info
    if (avgVowelEnergy > 80 || maxDeviation > 20) {
      console.log('Sound sequence analysis:', {
        currentFrame: {
          maxDeviation,
          avgVowelEnergy,
          avgLowFreqEnergy
        },
        sequenceLength: sequence.length,
        peakFound: peakIndex !== -1,
        peakIndex,
        maxPeak,
        maxVowelEnergy,
        maxVowelIndex,
        foundUhPattern,
        fullSequence: sequence.map(s => ({
          maxDev: s.maxDeviation,
          vowelE: s.avgVowelEnergy,
          lowE: s.avgLowFreqEnergy,
          age: now - s.timestamp
        }))
      });
    }

    const isPuhSound = 
      peakIndex !== -1 && 
      foundUhPattern && 
      // Make sure the timing between peak and vowel is right
      (maxVowelIndex * 16) < 150; // Each frame is about 16ms

    if (isPuhSound && !successRef.current) {
      successRef.current = true;
      return true;
    }

    return false;
  };

  const analyzeAudio = () => {
    if (!analyserRef.current || successRef.current) return;

    const frequencyData = new Uint8Array(analyserRef.current.frequencyBinCount);
    const timeDomainData = new Uint8Array(analyserRef.current.frequencyBinCount);

    analyserRef.current.getByteFrequencyData(frequencyData);
    analyserRef.current.getByteTimeDomainData(timeDomainData);

    const isPuhSound = detectPuhSound(frequencyData, timeDomainData);

    if (isPuhSound) {
      successRef.current = true;
      setFeedback('Good job!');
      stopRecording();
    }

    if (!successRef.current) {
      animationFrameRef.current = requestAnimationFrame(analyzeAudio);
    }
  };

  const startRecording = async () => {
    try {
      successRef.current = false;
      soundBufferRef.current = [];  // Clear sound buffer
      setFeedback('');

      // Initialize audio context
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }

      // Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      // Set up audio nodes
      const source = audioContextRef.current.createMediaStreamSource(stream);
      const analyser = audioContextRef.current.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.8;
      source.connect(analyser);
      analyserRef.current = analyser;

      setIsRecording(true);
      analyzeAudio();

      // Stop recording after 3 seconds if no success
      setTimeout(() => {
        if (!successRef.current) {
          stopRecording();
          setFeedback('Try again!');
        }
      }, 3000);

    } catch (error) {
      console.error('Error accessing microphone:', error);
      setFeedback('Please allow microphone access');
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    setIsRecording(false);
  };

  return (
    <div className="second-page">
      <button 
        className="back-button"
        onClick={() => navigate('/')}
      >
        ← Back
      </button>
      <div className="coin-container" onClick={!isRecording ? startRecording : undefined}>
        <img 
          src={coinImage}
          alt="Click to record" 
          className={`floating-coin ${isRecording ? 'recording' : ''}`} 
        />
      </div>
      {feedback && (
        <div className="speech-bubble">
          <div className={`feedback ${feedback === 'Good job!' ? 'success' : 'try-again'}`}>
            {feedback}
          </div>
        </div>
      )}
      <div className="bunny-container">
        <img src={bunnyImage} alt="Cute bunny" className="bunny-image" />
      </div>
      <h1>Pp</h1>
    </div>
  );
}

export default SecondPage; 