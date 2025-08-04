// WebRTC service for video chat functionality
class WebRTCService {
  constructor() {
    this.localStream = null;
    this.remoteStream = null;
    this.peerConnection = null;
    this.isInitialized = false;
    this.onRemoteStreamCallback = null;
    this.onConnectionStateChangeCallback = null;
    
    // STUN servers for NAT traversal
    this.configuration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    };
  }

  async initialize() {
    try {
      // Get user media (camera and microphone)
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      this.isInitialized = true;
      return this.localStream;
    } catch (error) {
      console.error('Failed to get user media, attempting to create dummy stream:', error);
      // Fallback for environments without real media devices (e.g., sandboxed environments)
      try {
        // Create a dummy video track
        const canvas = document.createElement('canvas');
        canvas.width = 640;
        canvas.height = 480;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.font = '30px Arial';
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.fillText('Dummy Video', canvas.width / 2, canvas.height / 2);

        const videoStream = canvas.captureStream(30); // 30 FPS
        const videoTrack = videoStream.getVideoTracks()[0];

        // Create a dummy audio track (silent)
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        gainNode.gain.value = 0; // Mute the audio
        oscillator.connect(gainNode);
        const audioDestination = audioContext.createMediaStreamDestination();
        gainNode.connect(audioDestination);
        const audioTrack = audioDestination.stream.getAudioTracks()[0];

        this.localStream = new MediaStream([videoTrack, audioTrack]);
        this.isInitialized = true;
        console.log('Successfully created dummy media stream.');
        return this.localStream;
      } catch (dummyError) {
        console.error('Failed to create dummy media stream:', dummyError);
        throw new Error('لا يمكن الوصول إلى الكاميرا أو الميكروفون، ولا يمكن إنشاء دفق وهمي.');
      }
    }
  }

  async createPeerConnection() {
    try {
      this.peerConnection = new RTCPeerConnection(this.configuration);

      // Add local stream tracks to peer connection
      if (this.localStream) {
        this.localStream.getTracks().forEach(track => {
          this.peerConnection.addTrack(track, this.localStream);
        });
      }

      // Handle remote stream
      this.peerConnection.ontrack = (event) => {
        this.remoteStream = event.streams[0];
        if (this.onRemoteStreamCallback) {
          this.onRemoteStreamCallback(this.remoteStream);
        }
      };

      // Handle connection state changes
      this.peerConnection.onconnectionstatechange = () => {
        const state = this.peerConnection.connectionState;
        console.log('Connection state:', state);
        
        if (this.onConnectionStateChangeCallback) {
          this.onConnectionStateChangeCallback(state);
        }
      };

      // Handle ICE candidates (for signaling)
      this.peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          // In a real application, you would send this candidate to the remote peer
          // through your signaling server
          console.log('ICE candidate:', event.candidate);
        }
      };

      return this.peerConnection;
    } catch (error) {
      console.error('Failed to create peer connection:', error);
      throw error;
    }
  }

  async createOffer() {
    if (!this.peerConnection) {
      await this.createPeerConnection();
    }

    try {
      const offer = await this.peerConnection.createOffer();
      await this.peerConnection.setLocalDescription(offer);
      return offer;
    } catch (error) {
      console.error('Failed to create offer:', error);
      throw error;
    }
  }

  async createAnswer(offer) {
    if (!this.peerConnection) {
      await this.createPeerConnection();
    }

    try {
      await this.peerConnection.setRemoteDescription(offer);
      const answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(answer);
      return answer;
    } catch (error) {
      console.error('Failed to create answer:', error);
      throw error;
    }
  }

  async handleAnswer(answer) {
    try {
      await this.peerConnection.setRemoteDescription(answer);
    } catch (error) {
      console.error('Failed to handle answer:', error);
      throw error;
    }
  }

  async addIceCandidate(candidate) {
    try {
      await this.peerConnection.addIceCandidate(candidate);
    } catch (error) {
      console.error('Failed to add ICE candidate:', error);
    }
  }

  toggleVideo(enabled) {
    if (this.localStream) {
      const videoTrack = this.localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = enabled;
        return true;
      }
    }
    return false;
  }

  toggleAudio(enabled) {
    if (this.localStream) {
      const audioTrack = this.localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = enabled;
        return true;
      }
    }
    return false;
  }

  getLocalStream() {
    return this.localStream;
  }

  getRemoteStream() {
    return this.remoteStream;
  }

  setOnRemoteStream(callback) {
    this.onRemoteStreamCallback = callback;
  }

  setOnConnectionStateChange(callback) {
    this.onConnectionStateChangeCallback = callback;
  }

  async stopStreams() {
    // Stop local stream
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        track.stop();
      });
      this.localStream = null;
    }

    // Close peer connection
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    this.remoteStream = null;
    this.isInitialized = false;
  }

  // Mock signaling for development (in production, use WebSocket or Socket.IO)
  mockSignaling() {
    return {
      sendOffer: (offer) => {
        console.log('Sending offer:', offer);
        // In production, send to signaling server
      },
      sendAnswer: (answer) => {
        console.log('Sending answer:', answer);
        // In production, send to signaling server
      },
      sendIceCandidate: (candidate) => {
        console.log('Sending ICE candidate:', candidate);
        // In production, send to signaling server
      }
    };
  }

  // Check if WebRTC is supported
  static isSupported() {
    return !!(navigator.mediaDevices && 
              navigator.mediaDevices.getUserMedia && 
              window.RTCPeerConnection);
  }

  // Get available devices
  static async getDevices() {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return {
        videoDevices: devices.filter(device => device.kind === 'videoinput'),
        audioDevices: devices.filter(device => device.kind === 'audioinput')
      };
    } catch (error) {
      console.error('Failed to get devices:', error);
      return { videoDevices: [], audioDevices: [] };
    }
  }
}

// Create and export a singleton instance
const webrtcService = new WebRTCService();
export default webrtcService;


