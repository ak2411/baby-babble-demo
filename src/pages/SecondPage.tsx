import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import coinImage from '../assets/coin.png';
import bunnyImage from '../assets/bunny.png';
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
  const [feedback, setFeedback] = useState<string>('');
  const recognitionRef = useRef<any>(null);
  const successRef = useRef(false);  // Add a ref to track success state

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
    
    // Remove class when component unmounts
    return () => {
      document.body.classList.remove('second-page-body');
    };
  }, []);

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
    
    // Set feedback based on detected sounds
    if (uniquePatterns.length === 0) {
      if (!successRef.current) {
        setFeedback('Try again!');
      }
    } else {
      const hasOSound = uniquePatterns.some(sound => sound.toLowerCase() === 'o');
      if (hasOSound) {
        successRef.current = true;
        setFeedback('Good job!');
        // Stop recording if we detect 'pu'
        if (recognitionRef.current) {
          recognitionRef.current.stop();
        }
      } else if (!successRef.current) {
        setFeedback('Try again!');
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
        setFeedback('');
      };

      recognition.onresult = (event: any) => {
        const results = Array.from(event.results);
        const latestResult = results[results.length - 1];
        const transcript = latestResult[0].transcript;
        setRecordedText(transcript);
        
        const sounds = analyzeSpeech(transcript);
        setDetectedSounds(sounds);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
        if (!successRef.current) {  // Check success ref instead of feedback
          setFeedback('Try again!');
        }
      };

      recognition.onend = () => {
        setIsRecording(false);
        // Only show try again if no sounds were detected and we haven't had success
        if (detectedSounds.length === 0 && !successRef.current) {
          setFeedback('Try again!');
        }
      };

      // Start recognition
      recognition.start();

      // Stop after 3 seconds only if we haven't detected 'pu'
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
      {(recordedText || detectedSounds.length > 0 || feedback) && (
        <div className="speech-bubble">
          <p className="detected-text">{recordedText}</p>
          {detectedSounds.length > 0 && (
            <div className="detected-sounds">
              <p>Sounds heard:</p>
              <div className="sound-badges">
                {detectedSounds.map((sound, index) => (
                  <span key={index} className="sound-badge">{sound}</span>
                ))}
              </div>
            </div>
          )}
          {feedback && (
            <div className={`feedback ${feedback === 'Good job!' ? 'success' : 'try-again'}`}>
              {feedback}
            </div>
          )}
        </div>
      )}
      <div className="bunny-container">
        <img src={bunnyImage} alt="Cute bunny" className="bunny-image" />
      </div>
      <h1>Oo</h1>
    </div>
  );
}

export default SecondPage; 