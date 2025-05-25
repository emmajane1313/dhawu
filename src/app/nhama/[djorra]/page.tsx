"use client";

import useVideo from "@/app/components/hooks/useVideo";
import { INFURA_GATEWAY, INTERNAL_INFURA_GATEWAY } from "@/app/lib/constantes";
import formatTime from "@/app/lib/helpers/formatTime";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { FormEvent } from "react";
import { IoArrowBackCircle } from "react-icons/io5";
import { MdSubtitles, MdSubtitlesOff } from "react-icons/md";

export default function NhamaDjorra() {
  const router = useRouter();
  const id = useParams();

  const {
    videoActual,
    progressRef,
    videoControlsInfo,
    setVideoControlsInfo,
    volume,
    volumeOpen,
    setVolumeOpen,
    handleSeek,
    handleVolumeChange,
    wrapperRef,
    sub,
    setSub,
  } = useVideo(id?.djorra as string);

  return (
    <div className="relative w-full h-full flex flex-col gap-4 items-start justify-between p-2 font-neueL text-white overflow-y-scroll">
      <div
        className="relative w-fit h-fit cursor-pointer hover:opacity-70 text-xs bg-black px-2 py-1 border border-white rounded-md items-center justify-center flex flex-row gap-2"
        onClick={() => router.push("/nhama")}
      >
        <IoArrowBackCircle color="white" size={15} />
        <div className="relative w-fit h-fit flex">roŋiyirri</div>
      </div>
      <div className="relative w-full flex flex-col gap-2 h-full items-start justify-start">
        <video
          key={sub ? videoActual?.url_doblado : videoActual?.url}
          ref={wrapperRef}
          src={`${INFURA_GATEWAY}/ipfs/${
            sub ? videoActual?.url_doblado : videoActual?.url
          }`}
          poster={`${INFURA_GATEWAY}/ipfs/${videoActual?.portada}`}
          className="relative w-full h-full flex rounded-md object-contain"
          onCanPlay={(e) =>
            setVideoControlsInfo((prev) => ({
              ...prev,
              duration: (e.target as any)?.duration,
            }))
          }
          onTimeUpdate={(e) =>
            setVideoControlsInfo((prev) => ({
              ...prev,
              currentTime: (e.target as any)?.currentTime,
            }))
          }
        ></video>
        <div className="relative w-full h-fit flex">
          <div
            className={`relative h-fit flex w-full gap-3 items-center justify-center flex-row md:flex-nowrap flex-wrap`}
          >
            <div className="relative w-fit h-full flex items-center text-base text-white">
              <span className="text-red">
                {formatTime(videoControlsInfo.currentTime || 0)}
              </span>
              /
              <span className="text-light">
                {formatTime(videoControlsInfo.duration || 0)}
              </span>
            </div>
            <div className="relative w-full h-full flex flex-col items-center justify-center">
              <div
                className="relative w-full h-2 bg-white/40 rounded-sm cursor-pointer"
                ref={progressRef}
                onClick={(e: any) => handleSeek(e)}
              >
                <div
                  className="absolute h-full bg-white/80 rounded-sm"
                  style={{
                    width: `${
                      ((videoControlsInfo.currentTime || 0) /
                        (videoControlsInfo.duration || 0)) *
                      100
                    }%`,
                  }}
                />
              </div>
            </div>
            <div
              className="relative w-fit h-fit flex cursor-pointer"
              onClick={() => {
                setSub(!sub);
                setVideoControlsInfo((prev) => ({
                  ...prev,
                  isPlaying: false,
                  currentTime: 0,
                }));
              }}
            >
              {sub ? (
                <MdSubtitlesOff color="FFFF00" width={12} />
              ) : (
                <MdSubtitles color="FFFF00" width={12} />
              )}
            </div>
            <div
              className={`relative w-fit flex flex-row gap-3 items-center justify-center sm:flex-nowrap flex-wrap md:justify-end`}
            >
              <div
                className="relative cursor-pointer w-3 h-3 flex items-center justify-center"
                onClick={() =>
                  setVideoControlsInfo((prev) => ({
                    ...prev,
                    isPlaying: !prev?.isPlaying,
                  }))
                }
              >
                <Image
                  src={`${INTERNAL_INFURA_GATEWAY}${
                    videoControlsInfo.isPlaying
                      ? "Qmbg8t4xoNywhtCexD5Ln5YWvcKMXGahfwyK6UHpR3nBip"
                      : "QmXw52mJFnzYXmoK8eExoHKv7YW9RBVEwSFtfvxXgy7sfp"
                  }`}
                  draggable={false}
                  width={12}
                  height={12}
                  alt="play"
                />
              </div>
              <div
                className="relative cursor-pointer w-3 h-3 flex items-center justify-center"
                onClick={() => setVolumeOpen(!volumeOpen)}
              >
                <Image
                  src={`${INTERNAL_INFURA_GATEWAY}${
                    volume === 0
                      ? "QmVVzvq68RwGZFi46yKEthuG6PXQf74BaMW4yCrZCkgtzK"
                      : "Qme1i88Yd1x4SJfgrSCFyXp7GELCZRnnPQeFUt6jbfPbqL"
                  }`}
                  width={12}
                  height={12}
                  alt="volume"
                  draggable={false}
                />
              </div>
              {volumeOpen && (
                <input
                  className="absolute w-40 h-fit bottom-10"
                  type="range"
                  value={volume}
                  max={1}
                  min={0}
                  step={0.1}
                  onChange={(e: FormEvent) => handleVolumeChange(e)}
                />
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="relative w-full h-fit flex flex-wrap gap-3 text-xs justify-center">
        {videoActual?.transcripciones?.map((tran, indice) => {
          return (
            <div
              key={indice}
              className="relative w-fit h-fit flex items-center justify-center text-center cursor-pointer hover:opacity-70 py-1 px-2 border border-white rounded-md"
              onClick={() =>
                window.open(`${INFURA_GATEWAY}/ipfs/${tran?.enlace}`)
              }
            >
              {tran?.locale}
            </div>
          );
        })}
      </div>
    </div>
  );
}
