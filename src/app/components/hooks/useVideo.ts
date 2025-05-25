import { FormEvent, MouseEvent, useEffect, useRef, useState } from "react";
import { Video } from "../types/components.type";
import { INFURA_GATEWAY, VIDEOS } from "@/app/lib/constantes";

const useVideo = (djorra: string) => {
  const [videoActual, setVideoActual] = useState<Video>();
  const progressRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLVideoElement>(null);
  const [volume, setVolume] = useState<number>(1);
  const [volumeOpen, setVolumeOpen] = useState<boolean>(false);
  const [sub, setSub] = useState<boolean>(false);
  const [videoControlsInfo, setVideoControlsInfo] = useState<{
    duration: number;
    currentTime: number;
    isPlaying: boolean;
  }>({
    duration: 0,
    currentTime: 0,
    isPlaying: false,
  });

  const handleVolumeChange = (e: FormEvent) => {
    setVolume(parseFloat((e.target as HTMLFormElement).value));

    if (wrapperRef.current) {
      wrapperRef.current.volume = parseFloat(
        (e.target as HTMLFormElement).value
      );
    }
  };

  const handleSeek = (
    e: MouseEvent<HTMLDivElement, MouseEvent<Element, MouseEvent>>
  ) => {
    const progressRect = e.currentTarget.getBoundingClientRect();
    const seekPosition = (e.clientX - progressRect.left) / progressRect.width;

    if (wrapperRef.current) {
      wrapperRef.current.currentTime =
        seekPosition * Number(videoControlsInfo?.duration);
    }

    setVideoControlsInfo((prev) => ({
      ...prev,
      currentTime: seekPosition * prev.duration,
    }));
  };

  useEffect(() => {
    if (djorra) {
      setVideoActual(VIDEOS[Number(djorra?.split("nhama-djorra-")?.[1]) - 1]);
    }
  }, [djorra]);

  useEffect(() => {
    if (!wrapperRef.current) return;

    if (videoControlsInfo?.isPlaying) {
      wrapperRef.current.play().catch((err) => {
        console.warn("Autoplay failed:", err);
      });
    } else {
      wrapperRef.current.pause();
    }
  }, [videoControlsInfo?.isPlaying, wrapperRef.current]);

  return {
    videoActual,
    progressRef,
    videoControlsInfo,
    setVideoControlsInfo,
    volume,
    volumeOpen,
    setVolumeOpen,
    handleVolumeChange,
    handleSeek,
    wrapperRef,
    sub,
    setSub,
  };
};

export default useVideo;
