import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import coinImage from '../assets/coin.png';
import bunnyImage from '../assets/bunny.png';
import goodJobSound from '../assets/good-job.mp3';
import tryAgainSound from '../assets/try-again.mp3';
import thumbsUpBunnyImage from '../assets/bunny-good.png';
import jumpingBunnyImage  from '../assets/bunny-running.png';

import '../App.css';

// Define types for the Web Speech API
declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

function SecondPage() {
  const navigate = useNavigate();
  const [isRecording, setIsRecording] = useState(false);
  const [recordedText, setRecordedText] = useState('');
  const [detectedSounds, setDetectedSounds] = useState<string[]>([]);
  const [showSuccessBunny, setShowSuccessBunny] = useState(false);
  const successRef = useRef(false);
  const recognitionRef = useRef<any>(null);
  const goodJobAudioRef = useRef<HTMLAudioElement | null>(null);
  const tryAgainAudioRef = useRef<HTMLAudioElement | null>(null);

  // Basic sound patterns for early speech
  const basicSounds = {
    'a': /^ah|aa|eh/i,
    'b': /^b[aeiou]|buh/i,
    'm': /^m[aeiou]|mm/i,
    'p': /^p[aeiou]|puh/i,
    'd': /^d[aeiou]|duh/i,
    't': /^t[aeiou]|tuh/i,
    'w': /^w[aeiou]|wuh/i,
    'n': /^n[aeiou]|nn/i,
    'h': /^h[aeiou]|huh/i,
    'l': /^l[aeiou]|ll/i,
    'g': /^g[aeiou]|guh/i,
    'k': /^k[aeiou]|kuh/i,
  };

  useEffect(() => {
    // Add class when component mounts
    document.body.classList.add('second-page-body');
    
    // Initialize audio elements
    goodJobAudioRef.current = new Audio(goodJobSound);
    tryAgainAudioRef.current = new Audio(tryAgainSound);
    
    // Remove class when component unmounts
    return () => {
      document.body.classList.remove('second-page-body');
    };
  }, []);

  const playFeedbackSound = (success: boolean) => {
    if (success) {
      goodJobAudioRef.current?.play();
      setShowSuccessBunny(true);
    } else {
      tryAgainAudioRef.current?.play();
      setShowSuccessBunny(false);
    }
  };

  const analyzeSpeech = (text: string) => {
    const lowerText = text.toLowerCase().trim();
    const soundUnits = lowerText.split(/\s+/);
    const detectedPatterns: string[] = [];
    
    soundUnits.forEach(unit => {
      // Check for basic sounds
      for (const [sound, pattern] of Object.entries(basicSounds)) {
        if (pattern.test(unit)) {
          detectedPatterns.push(sound);
        }
      }
      
      // Check for specific vowel sounds
      if (/^[aeiou]/i.test(unit)) {
        detectedPatterns.push(unit[0]);
      }
      
      // Check for consonant-vowel combinations
      if (/^[bcdfghjklmnpqrstvwxyz][aeiou]/i.test(unit)) {
        detectedPatterns.push(unit.slice(0, 2));
      }
    });

    const uniquePatterns = [...new Set(detectedPatterns)];
    
    // Play feedback sound based on detected sounds
    if (uniquePatterns.length === 0) {
      if (!successRef.current) {
        playFeedbackSound(false);
      }
    } else {
      const hasOSound = uniquePatterns.some(sound => sound.toLowerCase() === 'o');
      if (hasOSound) {
        successRef.current = true;
        playFeedbackSound(true);
        // Stop recording if we detect 'o'
        if (recognitionRef.current) {
          recognitionRef.current.stop();
        }
      } else if (!successRef.current) {
        playFeedbackSound(false);
      }
    }
    
    return uniquePatterns;
  };

  const startRecording = async () => {
    try {
      successRef.current = false;  // Reset success flag at start of recording
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      
      recognition.lang = 'en-US';
      recognition.continuous = false;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setIsRecording(true);
        setRecordedText('');
        setDetectedSounds([]);
        setShowSuccessBunny(false);
      };

      recognition.onresult = (event: any) => {
        const results = Array.from(event.results);
        const latestResult = results[results.length - 1];
        const transcript = latestResult[0].transcript;
        setRecordedText(transcript);
        
        const sounds = analyzeSpeech(transcript);
        setDetectedSounds(sounds);

        // Single line console log
        console.log(`Speech Recognition - Text: "${transcript}", Detected Sounds: [${sounds.join(', ')}]`);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
        if (!successRef.current) {  // Check success ref instead of feedback
          playFeedbackSound(false);
        }
      };

      recognition.onend = () => {
        setIsRecording(false);
        // Only show try again if no sounds were detected and we haven't had success
        if (detectedSounds.length === 0 && !successRef.current) {
          playFeedbackSound(false);
        }
      };

      // Start recognition
      recognition.start();

      // Stop after 3 seconds only if we haven't detected 'o'
      setTimeout(() => {
        if (recognitionRef.current && !successRef.current) {
          recognitionRef.current.stop();
        }
      }, 3000);

    } catch (error) {
      console.error('Error starting speech recognition:', error);
      alert('Speech recognition is not supported in this browser');
      setIsRecording(false);
    }
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
      <div className="bunny-container">
        <img 
          src={showSuccessBunny ? thumbsUpBunnyImage : bunnyImage} 
          alt={showSuccessBunny ? "Happy bunny" : "Cute bunny"} 
          className="bunny-image" 
        />
      </div>
      <h1>Oo</h1>
    </div>
  );
}

export default SecondPage; 