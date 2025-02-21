import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Fonction pour récupérer la liste des fichiers MP3 via l'API
async function fetchMusicFiles(): Promise<string[]> {
  const res = await fetch("/api/music");
  if (!res.ok) throw new Error("Erreur API music");
  return await res.json();
}

const MusicPlayer: React.FC = () => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [files, setFiles] = useState<string[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [progress, setProgress] = useState<number>(0);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(1);
  const [prevVolume, setPrevVolume] = useState<number>(1);
  const [hasStarted, setHasStarted] = useState<boolean>(false);

  const unselectStyle: React.CSSProperties = { userSelect: "none" };

  // Récupération des fichiers au montage
  useEffect(() => {
    fetchMusicFiles()
      .then((data) => {
        if (data.length > 0) {
          setFiles(data);
          const randomFile = data[Math.floor(Math.random() * data.length)];
          setHistory([randomFile]);
        }
      })
      .catch((err) => console.error("Erreur fetch /api/music :", err));
  }, []);

  const currentTrack = history[history.length - 1] || "";

  // Chargement de la piste
  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.load();
    if (currentTrack && isPlaying) {
      audioRef.current.play().catch(() => {});
    }
  }, [currentTrack]);

  const handlePlayPause = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      setPrevVolume(volume);
      setVolume(0);
      audioRef.current.pause();
      audioRef.current.muted = true;
      setIsMuted(true);
      setIsPlaying(false);
    } else {
      const restoredVolume = prevVolume > 0 ? prevVolume : 1;
      setVolume(restoredVolume);
      audioRef.current.muted = false;
      setIsMuted(false);
      audioRef.current
        .play()
        .then(() => {
          setIsPlaying(true);
          setHasStarted(true);
        })
        .catch(() => {});
    }
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    if (!isMuted) {
      setPrevVolume(volume);
      setVolume(0);
      setIsMuted(true);
      audioRef.current.muted = true;
    } else {
      setVolume(prevVolume);
      setIsMuted(false);
      audioRef.current.muted = false;
    }
  };

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
      audioRef.current.muted = isMuted;
    }
  }, [isMuted, volume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const updateProgress = () => {
      if (!audio.duration) {
        setProgress(0);
        return;
      }
      setProgress((audio.currentTime / audio.duration) * 100);
    };
    audio.addEventListener("timeupdate", updateProgress);
    return () => audio.removeEventListener("timeupdate", updateProgress);
  }, []);

  const handleEnded = () => {
    if (files.length === 0) return;
    const next = files[Math.floor(Math.random() * files.length)];
    setHistory((prev) => [...prev, next]);
    setIsPlaying(true);
  };

  const nextTrack = () => {
    if (files.length === 0) return;
    const randomFile = files[Math.floor(Math.random() * files.length)];
    setHistory((prev) => [...prev, randomFile]);
    setIsPlaying(true);
  };

  const previousTrack = () => {
    if (history.length > 1) {
      setHistory((prev) => prev.slice(0, prev.length - 1));
      setIsPlaying(true);
    }
  };

  const restartTrack = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      setProgress(0);
    }
  };

  const getTrackName = (filePath: string) =>
    filePath.replace(/\.mp3$/i, "");

  const currentTrackPath = `/musiques/${currentTrack}`;

  // Gestion du clic extérieur pour replier le menu
  useEffect(() => {
    const handleOutsideClick = (event: PointerEvent) => {
      if (isExpanded && containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsExpanded(false);
      }
    };
    document.addEventListener("pointerdown", handleOutsideClick);
    return () =>
      document.removeEventListener("pointerdown", handleOutsideClick);
  }, [isExpanded]);

  const handleExpand = () => {
    setIsExpanded(true);
    if (!hasStarted && audioRef.current) {
      setVolume(1);
      audioRef.current.muted = false;
      setIsMuted(false);
      audioRef.current
        .play()
        .then(() => {
          setIsPlaying(true);
          setHasStarted(true);
        })
        .catch(() => {});
    }
  };

  const sliderStyle: React.CSSProperties = {
    width: "100%",
    height: "6px",
    borderRadius: "3px",
    appearance: "none",
    background: `linear-gradient(to right, #add8e6 ${volume * 100}%, #ccc ${volume * 100}%)`,
    verticalAlign: "middle",
    margin: "0",
  };

  return (
    <>
      <audio ref={audioRef} onEnded={handleEnded}>
        <source src={currentTrackPath} type="audio/mp3" />
        Votre navigateur ne supporte pas l'élément audio.
      </audio>
      <div
        ref={containerRef}
        style={{
          position: "fixed",
          bottom: "10px",
          right: "10px",
          zIndex: 1000,
          ...unselectStyle,
        }}
      >
        <AnimatePresence>
          {isExpanded ? (
            <motion.div
              key="expanded"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              transition={{ duration: 0.4 }}
              style={{
                background: "rgba(255,255,255,0.95)",
                padding: "15px 20px",
                borderRadius: "10px",
                boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
                fontFamily: "Arial, sans-serif",
                color: "#333",
                width: "350px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "10px",
                }}
              >
                <div style={{ fontWeight: "bold", fontSize: "1rem" }}>
                  {getTrackName(currentTrack)}
                </div>
                <button
                  onClick={() => setIsExpanded(false)}
                  style={{
                    background: "none",
                    border: "none",
                    fontSize: "1.2rem",
                    cursor: "pointer",
                  }}
                >
                  ✖
                </button>
              </div>
              <div
                style={{
                  height: "6px",
                  background: "#ccc",
                  borderRadius: "4px",
                  overflow: "hidden",
                  marginBottom: "10px",
                }}
              >
                <div
                  style={{
                    width: `${progress}%`,
                    height: "100%",
                    background: "#e60000",
                  }}
                ></div>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  marginBottom: "10px",
                }}
              >
                <button
                  onClick={restartTrack}
                  style={{
                    padding: "5px 10px",
                    cursor: "pointer",
                    fontSize: "1rem",
                  }}
                >
                  ↺
                </button>
                <button
                  onClick={previousTrack}
                  style={{
                    padding: "5px 10px",
                    cursor: "pointer",
                    fontSize: "1rem",
                  }}
                  disabled={history.length <= 1}
                >
                  ⏮
                </button>
                <button
                  onClick={handlePlayPause}
                  style={{
                    padding: "5px 10px",
                    cursor: "pointer",
                    fontSize: "1rem",
                  }}
                >
                  {isPlaying ? "⏸" : "▶"}
                </button>
                <button
                  onClick={nextTrack}
                  style={{
                    padding: "5px 10px",
                    cursor: "pointer",
                    fontSize: "1rem",
                  }}
                >
                  ⏭
                </button>
                <button
                  onClick={toggleMute}
                  style={{
                    padding: "5px 10px",
                    cursor: "pointer",
                    fontSize: "1rem",
                  }}
                >
                  {isMuted ? "🔇" : "🔊"}
                </button>
                <div style={{ width: "100px" }}>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={volume}
                    onChange={(e) => {
                      const newVol = Number(e.target.value);
                      setVolume(newVol);
                      if (newVol === 0) {
                        setIsMuted(true);
                        if (audioRef.current) audioRef.current.muted = true;
                      } else {
                        setIsMuted(false);
                        if (audioRef.current) audioRef.current.muted = false;
                      }
                    }}
                    style={sliderStyle}
                  />
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="collapsed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={{
                position: "absolute",
                bottom: 0,
                right: 0,
              }}
            >
              <button
                onClick={handleExpand}
                style={{
                  background: "white",
                  border: "2px solid #ccc",
                  borderRadius: "50%",
                  width: "50px",
                  height: "50px",
                  fontSize: "1.5rem",
                  cursor: "pointer",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
                }}
              >
                {isMuted ? "🔇" : "🔊"}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

export default MusicPlayer;
