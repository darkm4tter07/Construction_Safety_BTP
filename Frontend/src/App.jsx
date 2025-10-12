import React, { useState, useRef, useEffect } from 'react';
import { Camera, Video, AlertTriangle, CheckCircle, Activity } from 'lucide-react';
import './App.css';

const SafetyMonitorDashboard = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [results, setResults] = useState(null);
  const [processedFrame, setProcessedFrame] = useState(null);
  const [fps, setFps] = useState(0);
  const [error, setError] = useState(null);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const wsRef = useRef(null);
  const streamRef = useRef(null);
  const animationRef = useRef(null);
  const isStreamingRef = useRef(false); // Add this ref to track streaming state

  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  const connectWebSocket = () => {
    const ws = new WebSocket('ws://localhost:8000/ws');
    
    ws.onopen = () => {
      setIsConnected(true);
      setError(null);
      console.log('✅ WebSocket connected');
      
      // Send ping every 10 seconds to keep connection alive
      const pingInterval = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'ping' }));
        } else {
          clearInterval(pingInterval);
        }
      }, 10000);
    };
    
    ws.onclose = () => {
      setIsConnected(false);
      console.log('❌ WebSocket disconnected');
      
      // Auto-reconnect if still streaming
      if (isStreamingRef.current) {
        console.log('🔄 Reconnecting in 2 seconds...');
        setTimeout(() => {
          if (isStreamingRef.current) {
            connectWebSocket();
          }
        }, 2000);
      }
    };
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'result') {
        setProcessedFrame(data.frame);
        setResults(data.data);
        setFps(data.data.fps);
      } else if (data.type === 'pong') {
        // Ping acknowledged
      } else if (data.type === 'error') {
        console.error('Backend error:', data.message);
        setError(data.message);
      }
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setError('WebSocket connection failed');
    };
    
    wsRef.current = ws;
  };

  const startCamera = async () => {
    try {
      setError(null);
      console.log('📷 Requesting camera access...');
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 640 },
          height: { ideal: 480 }
        } 
      });
      
      console.log('✅ Camera access granted');
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        
        // Wait for video to be ready before starting
        videoRef.current.onloadedmetadata = () => {
          console.log('📹 Video metadata loaded');
          videoRef.current.play().then(() => {
            console.log('▶️ Video playing, dimensions:', 
              videoRef.current.videoWidth, 'x', videoRef.current.videoHeight);
            
            // Connect WebSocket first
            if (!isConnected) {
              console.log('🔌 Connecting WebSocket...');
              connectWebSocket();
            }
            
            // Set both state and ref
            setIsStreaming(true);
            isStreamingRef.current = true;
            
            // Start capturing after WebSocket connects
            setTimeout(() => {
              console.log('🎬 Calling startFrameCapture, isStreamingRef =', isStreamingRef.current);
              startFrameCapture();
            }, 1000);
          }).catch(err => {
            console.error('❌ Video play error:', err);
            setError(`Video play failed: ${err.message}`);
          });
        };
      }
    } catch (err) {
      console.error('❌ Error accessing camera:', err);
      setError(`Camera error: ${err.message}`);
      alert('Could not access camera. Please grant permission and try again.');
    }
  };

  const startFrameCapture = () => {
    console.log('🎬 Starting frame capture...');
    let frameCount = 0;
    let lastSendTime = 0;
    const minFrameInterval = 200; // Send at most every 200ms (5 FPS max)
    
    const captureFrame = () => {
      // Use ref instead of state to avoid closure issues
      if (!isStreamingRef.current) {
        console.log('⏸️ Streaming stopped');
        return;
      }
      
      if (!videoRef.current || !canvasRef.current || !wsRef.current) {
        animationRef.current = requestAnimationFrame(captureFrame);
        return;
      }
      
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // Check if video has valid dimensions
      if (video.readyState !== video.HAVE_ENOUGH_DATA || 
          video.videoWidth === 0 || video.videoHeight === 0) {
        animationRef.current = requestAnimationFrame(captureFrame);
        return;
      }
      
      // Check WebSocket state before processing
      if (wsRef.current.readyState !== WebSocket.OPEN) {
        // Don't spam the console
        if (frameCount % 100 === 0) {
          console.log('⏳ Waiting for WebSocket to open...');
        }
        frameCount++;
        animationRef.current = requestAnimationFrame(captureFrame);
        return;
      }
      
      // Throttle frame sending
      const now = Date.now();
      if (now - lastSendTime < minFrameInterval) {
        animationRef.current = requestAnimationFrame(captureFrame);
        return;
      }
      lastSendTime = now;
      
      const ctx = canvas.getContext('2d');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0);
      
      canvas.toBlob((blob) => {
        if (!blob) {
          console.error('❌ Failed to create blob');
          return;
        }
        
        const reader = new FileReader();
        reader.onloadend = () => {
          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            try {
              wsRef.current.send(JSON.stringify({
                type: 'frame',
                frame: reader.result
              }));
              frameCount++;
              if (frameCount % 30 === 0) {
                console.log(`✅ Sent ${frameCount} frames`);
              }
            } catch (e) {
              console.error('❌ Error sending frame:', e);
            }
          }
        };
        reader.readAsDataURL(blob);
      }, 'image/jpeg', 0.8);
      
      animationRef.current = requestAnimationFrame(captureFrame);
    };
    
    captureFrame();
  };

  const stopCamera = () => {
    console.log('🛑 Stopping camera...');
    isStreamingRef.current = false;
    setIsStreaming(false);
    
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (wsRef.current) {
      wsRef.current.close();
    }
    setIsConnected(false);
    setProcessedFrame(null);
    setResults(null);
  };

  const getRiskColor = (score, maxScore) => {
    const ratio = score / maxScore;
    if (ratio < 0.3) return 'bg-green-500';
    if (ratio < 0.6) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getRiskIcon = (riskLevel) => {
    if (riskLevel.includes('Acceptable') || riskLevel.includes('Low') || riskLevel.includes('Negligible')) {
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    }
    return <AlertTriangle className="w-5 h-5 text-red-500" />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
            <Activity className="w-10 h-10 text-blue-400" />
            Construction Safety Monitor
          </h1>
          <p className="text-gray-400">Real-time PPE Detection & Ergonomic Analysis</p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-500/20 border border-red-500 rounded-lg p-4 text-red-400">
            {error}
          </div>
        )}

        {/* Connection Status */}
        <div className="mb-6 flex gap-4">
          <div className={`px-4 py-2 rounded-lg ${isConnected ? 'bg-green-500/20 text-green-400' : 'bg-gray-700'}`}>
            <span className="font-semibold">WebSocket: {isConnected ? 'Connected' : 'Disconnected'}</span>
          </div>
          <div className={`px-4 py-2 rounded-lg ${isStreaming ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-700'}`}>
            <span className="font-semibold">Camera: {isStreaming ? 'Active' : 'Inactive'}</span>
          </div>
          <div className="px-4 py-2 rounded-lg bg-gray-700">
            <span className="font-semibold">FPS: {fps.toFixed(1)}</span>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Video Feed */}
          <div className="lg:col-span-2 space-y-4">
            {/* Control Buttons */}
            <div className="flex gap-4">
              {!isStreaming ? (
                <button
                  onClick={startCamera}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition"
                >
                  <Camera className="w-5 h-5" />
                  Start Camera
                </button>
              ) : (
                <button
                  onClick={stopCamera}
                  className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 rounded-lg font-semibold transition"
                >
                  <Video className="w-5 h-5" />
                  Stop Camera
                </button>
              )}
            </div>

            {/* Video Display */}
            <div className="bg-gray-800 rounded-lg overflow-hidden shadow-2xl">
              <div className="relative">
                {processedFrame ? (
                  <img 
                    src={processedFrame} 
                    alt="Processed feed" 
                    className="w-full h-auto"
                  />
                ) : (
                  <div className="aspect-video bg-gray-700 flex items-center justify-center">
                    <p className="text-gray-400">No video feed</p>
                  </div>
                )}
                
                {/* Hidden video and canvas elements */}
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="hidden"
                />
                <canvas ref={canvasRef} className="hidden" />
              </div>
            </div>
          </div>

          {/* Results Panel */}
          <div className="space-y-4">
            {/* PPE Detection Results */}
            <div className="bg-gray-800 rounded-lg p-5 shadow-xl">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <CheckCircle className="w-6 h-6 text-blue-400" />
                PPE Detection
              </h2>
              
              {results && results.detections && results.detections.length > 0 ? (
                <div className="space-y-3">
                  {results.detections.map((detection, idx) => (
                    <div key={idx} className="bg-gray-700 rounded-lg p-3">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-semibold text-sm">{detection.class_id}</span>
                        <span className={`px-2 py-1 rounded text-xs ${
                          detection.conf > 0.7 ? 'bg-green-500' : 'bg-yellow-500'
                        }`}>
                          {(detection.conf * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-600 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            detection.conf > 0.7 ? 'bg-green-500' : 'bg-yellow-500'
                          }`}
                          style={{ width: `${detection.conf * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-sm">No PPE detected</p>
              )}
            </div>

            {/* Ergonomic Analysis */}
            <div className="bg-gray-800 rounded-lg p-5 shadow-xl">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Activity className="w-6 h-6 text-purple-400" />
                Ergonomic Analysis
              </h2>
              
              {results && results.posture ? (
                <div className="space-y-4">
                  {/* RULA Score */}
                  {results.posture.rula && results.posture.rula.score && (
                    <div className="bg-gray-700 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold">RULA Score</span>
                        {getRiskIcon(results.posture.rula.risk_level)}
                      </div>
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold ${
                          getRiskColor(results.posture.rula.score, 7)
                        }`}>
                          {results.posture.rula.score}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-gray-300">
                            {results.posture.rula.risk_level}
                          </p>
                          <div className="w-full bg-gray-600 rounded-full h-2 mt-2">
                            <div 
                              className={`h-2 rounded-full ${
                                getRiskColor(results.posture.rula.score, 7)
                              }`}
                              style={{ width: `${(results.posture.rula.score / 7) * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* REBA Score */}
                  {results.posture.reba && results.posture.reba.score && (
                    <div className="bg-gray-700 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold">REBA Score</span>
                        {getRiskIcon(results.posture.reba.risk_level)}
                      </div>
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold ${
                          getRiskColor(results.posture.reba.score, 15)
                        }`}>
                          {results.posture.reba.score}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-gray-300">
                            {results.posture.reba.risk_level}
                          </p>
                          <div className="w-full bg-gray-600 rounded-full h-2 mt-2">
                            <div 
                              className={`h-2 rounded-full ${
                                getRiskColor(results.posture.reba.score, 15)
                              }`}
                              style={{ width: `${(results.posture.reba.score / 15) * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-400 text-sm">No posture data available</p>
              )}
            </div>

            {/* Risk Legend */}
            <div className="bg-gray-800 rounded-lg p-5 shadow-xl">
              <h3 className="text-lg font-bold mb-3">Risk Levels</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-green-500"></div>
                  <span>Low Risk (Acceptable)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-yellow-500"></div>
                  <span>Medium Risk (Investigate)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-red-500"></div>
                  <span>High Risk (Change Soon)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SafetyMonitorDashboard;