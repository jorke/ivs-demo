'use client';

import React, { useEffect, useRef, useState } from 'react';
import { AmazonIVSBroadcastClient } from 'amazon-ivs-web-broadcast';

async function handlePermissions() {
  let permissions = {
      audio: false,
      video: false,
  };
  try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      for (const track of stream.getTracks()) {
          track.stop();
      }
      permissions = { video: true, audio: true };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
      permissions = { video: false, audio: false };
      console.error(err.message);
  }
  // If we still don't have permissions after requesting them display the error message
  if (!permissions.video) {
      console.error('Failed to get video permissions.');
  } else if (!permissions.audio) {
      console.error('Failed to get audio permissions.');
  }
  
}

type Props = {
  ingestEndpoint: string
  streamKey: string
}

export default function Broadcaster({ingestEndpoint, streamKey}: Props) {
  const clientRef = useRef<AmazonIVSBroadcastClient>(undefined);
  const videoPreviewRef = useRef<HTMLCanvasElement | null>(null)
  const [isPublishing, setIsPublishing] = useState(false)

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [deviceState, setDeviceState] = useState<{
      loading: boolean;
      error: string | null;
      cameraEnabled: boolean;
      microphoneEnabled: boolean;
    }>({
    loading: false,
    error: null,
    cameraEnabled: true,
    microphoneEnabled: true,
  });
  
  const init = async () => {
    setDeviceState(prev => ({ ...prev, loading: true, error: null }));

    const IVSBroadcastClient = ((await import('amazon-ivs-web-broadcast')).default)
  
    const streamConfig = IVSBroadcastClient.BASIC_LANDSCAPE
    const client = IVSBroadcastClient.create({
      // Enter the desired stream configuration
      streamConfig,
      ingestEndpoint,
      logLevel: 1
    });

    console.log(client.getSessionId())

    const handleActiveStateChange = (active: unknown) => {
      if (active) 
        console.log(clientRef.current?.getSessionId())
    } 

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    client.on('activeStateChange', handleActiveStateChange)

    clientRef.current = client

    await handlePermissions()

  
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = devices.filter((d) => d.kind === 'videoinput');
    const audioDevices = devices.filter((d) => d.kind === 'audioinput');

    console.log(videoDevices, audioDevices)

    const cameraStream = await navigator.mediaDevices.getUserMedia({
      video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: 30 },
      }
    })
    const microphoneStream = await navigator.mediaDevices.getUserMedia({
      audio: { deviceId: audioDevices[0].deviceId },
    });

    clientRef.current.attachPreview(videoPreviewRef.current!);

    await clientRef.current.addVideoInputDevice(cameraStream, 'camera1', { index: 0 })
    await clientRef.current.addAudioInputDevice(microphoneStream, 'mic1')

    
  }

  const onStart = async () => {
    try {
      const b = await clientRef.current?.startBroadcast(streamKey)
      console.log(b)
      setIsPublishing(true)
      console.log('started broadcast')
    } catch (error) {
      console.error('Failed to start publishing:', error);
      setDeviceState(prev => ({
        ...prev,
        error: 'Failed to start broadcasting. Please try again.',
      }));
    }
  }

  const onStop = async () => {
    if (clientRef.current) {
      try {
        const s = await clientRef.current.stopBroadcast();
        console.log(s)
        setIsPublishing(false)
      } catch (error) {
        console.error('Error stopping broadcast:', error);
      }
    }
  }

  useEffect(() => {
    init()
  }, [])
  
  return (
    <div className={`flex flex-col gap-4`}>
      <div className="relative">
        <canvas ref={videoPreviewRef}></canvas>
      </div>
      <div className="flex gap-2">
        <button onClick={isPublishing ? onStop : onStart} 
          disabled={!streamKey}
          className={`px-6 py-2 rounded-lg font-medium  text-white disabled:bg-gray-400 disabled:cursor-not-allowed ${
            isPublishing
              ? 'bg-red-500 hover:bg-red-600'
              : 'bg-blue-500 hover:bg-blue-600'
          }`}>
            {isPublishing}
            {isPublishing ? 'Stop Broadcast' : 'Start broadcast'}
        </button>
        
      </div>
      <div className="flex gap-2">
        {/* {children} */}
      </div>
    </div>
  )
}

