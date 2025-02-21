"use client";

import React from 'react'
import VideoJS from './Video';
import videojs from 'video.js';

export default function Play() {

  const playerRef = React.useRef(null);
  const [vidSource, setVidSource] = React.useState()
  const videoJsOptions = {
    autoplay: true,
    controls: true,
    responsive: true,
    fluid: true,
    // sources: [{
    //   src: 'https://xxxx.cloudfront.net/ivs/v1/xxx/LQQQKXDAHTBB/2025/2/20/11/18/xxx/media/hls/master.m3u8',
    // }]
  };

  const playVid = () => {
    const player = playerRef.current;
    setVidSource(vidSource)
    // console.log(vidSource)
    player.src({src: vidSource});
    player.play();
  }



  const handlePlayerReady = (player) => {
    playerRef.current = player;

    // You can handle player events here, for example:
    player.on('waiting', () => {
      videojs.log('player is waiting');
    });

    player.on('dispose', () => {
      videojs.log('player will dispose');
    });
  };


  return (
    <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
      <div className={`flex w-full flex-col gap-4`}>
        {/* <div className="relative w-100"> */}
          <VideoJS options={videoJsOptions} onReady={handlePlayerReady}/>
        {/* </div> */}
        <div className="flex gap-2">
          <input 
            className="px-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-black" 
            placeholder="Enter IVS .m3u8"
            onChange={(e) => setVidSource(e.target.value)}
            value={vidSource}
          />
          <button 
            onClick={playVid}
            className={`px-6 py-2 rounded-lg font-medium  text-white disabled:bg-gray-400 disabled:cursor-not-allowed`} type="submit">
            Load
            </button>
        </div>
      </div>
    </main>
  );
}
