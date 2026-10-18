
import { useEffect, useRef, useState } from "react";
import confetti from "canvas-confetti";
import {
  Moon, Sun, Sparkles, Volume2, VolumeX, Music2, Heart,
  Trash2, Plus, Flower2, Trophy, CheckCircle2, RotateCcw,
  Target, LockKeyhole, Award,
} from "lucide-react";
import "./index.css";

const WISH_KEY = "lumiWishes";
const CHALLENGE_KEY = "lumiChallengeCompleted";
const SOUND_KEY = "lumiSoundOn";
const MUSIC_KEY = "lumiMusicOn";
const REWARDS_KEY = "lumiRewards";
const STARS_PER_WISH = 10;
const DAILY_BONUS_STARS = 5;

const challenges = [
  { title: "Spread a Little Kindness", description: "Do one kind thing for someone today.", emoji: "💗" },
  { title: "Draw Your Dream", description: "Draw one thing you dream of achieving.", emoji: "🎨" },
  { title: "Say Thank You", description: "Thank someone who makes your day brighter.", emoji: "🌷" },
  { title: "Take a Brave Step", description: "Try one small thing you have been afraid to try.", emoji: "🦋" },
  { title: "Look at the Sky", description: "Take a little break and enjoy the sky.", emoji: "☁️" },
  { title: "Write a Happy Memory", description: "Write down one memory that makes you smile.", emoji: "📖" },
  { title: "Believe in Yourself", description: "Say one nice thing about yourself today.", emoji: "✨" },
];

const rewardLevels = [
  { name: "Beginner Dreamer", emoji: "🌱", stars: 0 },
  { name: "Little Dreamer", emoji: "🌷", stars: 50 },
  { name: "Star Collector", emoji: "🌟", stars: 100 },
  { name: "Dream Champion", emoji: "🏆", stars: 200 },
];

const dreamBadges = [
  { id: 1, title: "First Dream", emoji: "🌱", description: "Complete your first wish", required: 1 },
  { id: 2, title: "Dream Collector", emoji: "🌸", description: "Complete 5 wishes", required: 5 },
  { id: 3, title: "Dream Master", emoji: "🌳", description: "Complete 10 wishes", required: 10 },
  { id: 4, title: "Dream Legend", emoji: "✨", description: "Complete 20 wishes", required: 20 },
];

function getTodayKey() {
  const date = new Date();
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

function getTodayChallenge() {
  const start = new Date(new Date().getFullYear(), 0, 0);
  const day = Math.floor((new Date() - start) / 86400000);
  return challenges[(day - 1 + challenges.length) % challenges.length];
}

function loadWishes() {
  try {
    const saved = JSON.parse(localStorage.getItem(WISH_KEY) || "[]");
    if (!Array.isArray(saved)) return [];
    return saved.map((wish, index) =>
      typeof wish === "string"
        ? { id: `old-${index}-${wish}`, text: wish, completed: false }
        : {
            id: wish.id ?? `wish-${index}`,
            text: wish.text ?? "",
            completed: Boolean(wish.completed),
          }
    );
  } catch {
    return [];
  }
}

function loadRewards() {
  try {
    const saved = JSON.parse(localStorage.getItem(REWARDS_KEY) || "{}");
    return {
      earnedWishIds: Array.isArray(saved.earnedWishIds) ? saved.earnedWishIds : [],
      dailyBonusDates: Array.isArray(saved.dailyBonusDates) ? saved.dailyBonusDates : [],
    };
  } catch {
    return { earnedWishIds: [], dailyBonusDates: [] };
  }
}

function playMagicSound(enabled) {
  if (!enabled) return;
  try {
    const AudioClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioClass) return;
    const audio = new AudioClass();
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(660, audio.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(990, audio.currentTime + 0.18);
    gain.gain.setValueAtTime(0.12, audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.3);
    oscillator.connect(gain);
    gain.connect(audio.destination);
    oscillator.start();
    oscillator.stop(audio.currentTime + 0.3);
    oscillator.onended = () => audio.close();
  } catch {
    // Sound is optional.
  }
}

function celebrate() {
  confetti({
    particleCount: 120,
    spread: 90,
    startVelocity: 38,
    origin: { y: 0.6 },
    colors: ["#ff7eb6", "#ffd166", "#a78bfa", "#7bdff2", "#b2f7ef"],
  });
}

export default function App() {
  const [isNight, setIsNight] = useState(false);
  const [soundOn, setSoundOn] = useState(() => localStorage.getItem(SOUND_KEY) !== "false");
  const [musicOn, setMusicOn] = useState(() => localStorage.getItem(MUSIC_KEY) === "true");
  const musicRef = useRef(null);

  const [message, setMessage] = useState("One tiny step can begin a wonderful journey. 🌱");
  const [wishInput, setWishInput] = useState("");
  const [wishes, setWishes] = useState(loadWishes);
  const [eyePosition, setEyePosition] = useState({ x: 0, y: 0 });
  const [surprise, setSurprise] = useState(false);
  const [challengeCompleted, setChallengeCompleted] = useState(
    () => localStorage.getItem(CHALLENGE_KEY) === getTodayKey()
  );
  const [challengeMessage, setChallengeMessage] = useState("");
  const [selectedWish, setSelectedWish] = useState("");
  const [rewards, setRewards] = useState(loadRewards);
  const [celebration, setCelebration] = useState(null);

  const challenge = getTodayChallenge();
  const completedWishes = wishes.filter((wish) => wish.completed);
  const flowerCount = completedWishes.length;
  const remainingWishes = wishes.length - flowerCount;
  const dailyBonusDates = rewards.dailyBonusDates || [];

  const totalStars =
    rewards.earnedWishIds.length * STARS_PER_WISH +
    dailyBonusDates.length * DAILY_BONUS_STARS;

  const currentLevel = [...rewardLevels].reverse().find((level) => totalStars >= level.stars) || rewardLevels[0];
  const nextLevel = rewardLevels.find((level) => level.stars > totalStars);
  const levelProgress = nextLevel
    ? Math.min(100, Math.round(((totalStars - currentLevel.stars) / (nextLevel.stars - currentLevel.stars)) * 100))
    : 100;

  const progress = wishes.length ? Math.round((flowerCount / wishes.length) * 100) : 0;
  const unlockedBadges = dreamBadges.filter((badge) => flowerCount >= badge.required);

  useEffect(() => {
    localStorage.setItem(WISH_KEY, JSON.stringify(wishes));
  }, [wishes]);

  useEffect(() => {
    localStorage.setItem(REWARDS_KEY, JSON.stringify(rewards));
  }, [rewards]);

  useEffect(() => {
    localStorage.setItem(SOUND_KEY, String(soundOn));
  }, [soundOn]);

  useEffect(() => {
    localStorage.setItem(MUSIC_KEY, String(musicOn));
  }, [musicOn]);

  // FIX: If today's challenge was already completed, ensure today's
  // bonus is recorded exactly once.
  useEffect(() => {
    if (!challengeCompleted) return;
    const today = getTodayKey();

    setRewards((current) => {
      const dates = current.dailyBonusDates || [];
      if (dates.includes(today)) return current;
      return { ...current, dailyBonusDates: [...dates, today] };
    });
  }, [challengeCompleted]);

  useEffect(() => {
    const audio = musicRef.current;
    if (!audio) return;
    if (musicOn) {
      audio.volume = 0.25;
      audio.play().catch(() => setMusicOn(false));
    } else {
      audio.pause();
      audio.currentTime = 0;
    }
  }, [musicOn]);

  useEffect(() => {
    const handleMouseMove = (event) => {
      setEyePosition({
        x: (event.clientX / window.innerWidth - 0.5) * 8,
        y: (event.clientY / window.innerHeight - 0.5) * 6,
      });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  function addWish(event) {
    event.preventDefault();
    const text = wishInput.trim();
    if (!text) return;

    setWishes((current) => [
      ...current,
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        text,
        completed: false,
      },
    ]);
    setWishInput("");
    setMessage("Your dream is planted! Take one little step toward it. 🌱");
    playMagicSound(soundOn);
  }

  function toggleWish(id) {
    const wish = wishes.find((item) => item.id === id);
    if (!wish) return;

    const willComplete = !wish.completed;
    setWishes((current) =>
      current.map((item) => item.id === id ? { ...item, completed: !item.completed } : item)
    );

    if (willComplete) {
      const alreadyEarned = rewards.earnedWishIds.includes(id);
      const before = totalStars;
      const after = before + (alreadyEarned ? 0 : STARS_PER_WISH);

      if (!alreadyEarned) {
        setRewards((current) => ({
          ...current,
          earnedWishIds: [...current.earnedWishIds, id],
        }));
      }

      const newBadge = dreamBadges.find((badge) => badge.required === flowerCount + 1);
      const newLevel = !alreadyEarned
        ? rewardLevels.find((level) => level.stars > before && level.stars <= after)
        : null;

      celebrate();

      if (newBadge) {
        setCelebration({
          title: `${newBadge.title} Unlocked!`,
          emoji: newBadge.emoji,
          description: newBadge.description,
          reward: "You have unlocked a new Dream Achievement badge!",
        });
        setMessage(`Congratulations! 🏆 You unlocked ${newBadge.title}!`);
      } else if (newLevel) {
        setCelebration({
          title: `${newLevel.name}!`,
          emoji: newLevel.emoji,
          description: `You reached ${newLevel.stars} Dream Stars.`,
          reward: "Your new Dream level is unlocked!",
        });
        setMessage(`Amazing! You reached ${newLevel.name}! ⭐`);
      } else {
        setMessage(`A dream came true! 🎉 You earned ${alreadyEarned ? 0 : STARS_PER_WISH} Dream Stars!`);
      }

      setSelectedWish(wish.text);
      playMagicSound(soundOn);
    } else {
      setMessage("Every dream has its own timing. Keep believing! 💗");
      setSelectedWish("");
    }
  }

  function deleteWish(id) {
    const wish = wishes.find((item) => item.id === id);
    setWishes((current) => current.filter((item) => item.id !== id));
    if (wish && selectedWish === wish.text) setSelectedWish("");
  }

  function clearWishes() {
    if (!wishes.length) return;
    setWishes([]);
    setSelectedWish("");
    setMessage("Your wish box is fresh and ready for new dreams. ✨");
  }

  function completeChallenge() {
    const today = getTodayKey();
    if (challengeCompleted) return;

    setChallengeCompleted(true);
    localStorage.setItem(CHALLENGE_KEY, today);

    // Add today's bonus once only.
    setRewards((current) => {
      const dates = current.dailyBonusDates || [];
      if (dates.includes(today)) return current;
      return { ...current, dailyBonusDates: [...dates, today] };
    });

    setChallengeMessage(`Amazing! You earned ${DAILY_BONUS_STARS} Bonus Dream Stars! 🎁⭐`);
    setMessage(`I'm proud of you, dreamer! You earned ${DAILY_BONUS_STARS} Bonus Dream Stars! 🌟`);
    setCelebration({
      title: "Daily Dream Bonus!",
      emoji: "🎁",
      description: "You completed today's Daily Dream Challenge!",
      reward: `+${DAILY_BONUS_STARS} Bonus Dream Stars! Keep shining! ⭐`,
    });
    celebrate();
    playMagicSound(soundOn);
  }

  function surpriseMe() {
    const surprises = [
      "You are made of stardust and possibilities! ✨",
      "One tiny step can begin a wonderful journey. 🌱",
      "Your dreams deserve patience and love. 💗",
      "You make the world brighter just by being you! 🌈",
      "Even the moon needs the night to shine. 🌙",
    ];
    setMessage(surprises[Math.floor(Math.random() * surprises.length)]);
    setSurprise((value) => !value);
    playMagicSound(soundOn);
  }

  function moonSecret() {
    setMessage("Psst... the moon says your dreams are worth believing in. 🌙💫");
    playMagicSound(soundOn);
  }

  function selectGardenWish(wish) {
    setSelectedWish(wish.text);
    setMessage(`Your beautiful dream: "${wish.text}" 🌸`);
    playMagicSound(soundOn);
  }

  return (
    <main className={`app ${isNight ? "night-mode" : ""}`}>
      <div className="background-stars" aria-hidden="true">✦　·　✧　　 ·　✦　　✧　·</div>

      <header className="topbar">
        <a className="brand" href="#home" aria-label="Lumi home">
          <span className="brand-icon">☁️</span>
          <span>Lumi's Dreamland</span>
        </a>

        <audio ref={musicRef} src="/dream-music.mp3" loop preload="none" />

        <div className="topbar-actions">
          <button type="button" className="icon-button" onClick={() => setMusicOn((v) => !v)} title={musicOn ? "Pause music" : "Play music"}>
            <Music2 size={19} />
          </button>
          <button type="button" className="icon-button" onClick={() => setSoundOn((v) => !v)} title={soundOn ? "Turn sound off" : "Turn sound on"}>
            {soundOn ? <Volume2 size={19} /> : <VolumeX size={19} />}
          </button>
          <button type="button" className="icon-button" onClick={() => setIsNight((v) => !v)} title={isNight ? "Day mode" : "Night mode"}>
            {isNight ? <Sun size={19} /> : <Moon size={19} />}
          </button>
        </div>
      </header>

      <section className="hero" id="home">
        <div className="hero-copy">
          <span className="eyebrow"><Sparkles size={15} /> A LITTLE WORLD OF BIG DREAMS</span>
          <h1>Meet Lumi,<br /><span>The Little Architect</span><br />of Dreams</h1>
          <p>A tiny friend to help you nurture your wishes, celebrate little victories, and build a garden full of dreams.</p>
          <div className="hero-actions">
            <a className="primary-button" href="#wish-box">Plant a dream <Heart size={17} /></a>
            <a className="secondary-button" href="#daily-challenge">Today's challenge <Sparkles size={16} /></a>
          </div>
        </div>

        <div className="character-section">
          <div className="lumi-cloud-container">
            <div className="orbit orbit-one" />
            <div className="orbit orbit-two" />
            <div className="lumi-cloud" aria-label="Lumi, a smiling cloud character">
              <div className="cloud-blush blush-left" />
              <div className="cloud-blush blush-right" />
              <div className="lumi-eyes">
                <span className="lumi-eye" style={{ transform: `translate(${eyePosition.x}px, ${eyePosition.y}px)` }} />
                <span className="lumi-eye" style={{ transform: `translate(${eyePosition.x}px, ${eyePosition.y}px)` }} />
              </div>
              <div className="lumi-smile" />
            </div>
            <span className="floating-star star-one">✦</span>
            <span className="floating-star star-two">✧</span>
            <span className="floating-star star-three">✦</span>
            <span className="floating-heart">♥</span>
          </div>
          <div className="speech-bubble">
            <span className="speech-name">Lumi says...</span>
            <p>{message}</p>
          </div>
          <button type="button" className="surprise-button" onClick={surpriseMe}>
            <Sparkles size={17} /> {surprise ? "One more surprise!" : "Surprise me!"}
          </button>
        </div>
      </section>

      <section className="stats-row" aria-label="Dream statistics">
        <div className="stat-card"><span className="stat-emoji">💌</span><div><strong>{wishes.length}</strong><span>Dreams planted</span></div></div>
        <div className="stat-card"><span className="stat-emoji">🌸</span><div><strong>{flowerCount}</strong><span>Dreams completed</span></div></div>
        <div className="stat-card"><span className="stat-emoji">✨</span><div><strong>{challengeCompleted ? "Done!" : "Ready"}</strong><span>Daily challenge</span></div></div>
      </section>

      <section className="progress-section" id="dream-progress">
        <div className="section-heading">
          <span className="eyebrow">EVERY LITTLE STEP COUNTS</span>
          <h2>My Dream Progress <span>🎯</span></h2>
          <p>Celebrate how far you have come, one dream at a time.</p>
        </div>
        <div className="progress-card">
          <div className="progress-card-top">
            <div className="progress-icon"><Target size={27} /></div>
            <div className="progress-summary">
              <h3>Your dream journey</h3>
              <p>{wishes.length === 0 ? "Plant your first dream to begin your journey!" : progress === 100 ? "Amazing! You completed every dream! 🎉" : "Keep going, every small step matters. 💗"}</p>
            </div>
            <strong className="progress-percentage">{progress}%</strong>
          </div>
          <div className="progress-track" role="progressbar" aria-label="Dream completion progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}>
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <div className="progress-details">
            <span><CheckCircle2 size={16} /> {flowerCount} completed</span>
            <span><Sparkles size={16} /> {remainingWishes} remaining</span>
            <span><Heart size={16} /> {wishes.length} total dreams</span>
          </div>
        </div>
      </section>

      <section className="badges-section rewards-section" id="achievement-rewards">
        <div className="section-heading">
          <span className="eyebrow">EVERY LITTLE WIN EARNS A LITTLE MAGIC</span>
          <h2>Achievement &amp; Rewards <span>🎁</span></h2>
          <p>Complete your wishes, collect Dream Stars, and level up on your journey.</p>
        </div>

        <div className="progress-card rewards-main-card">
          <div className="progress-card-top">
            <div className="progress-icon"><Sparkles size={27} /></div>
            <div className="progress-summary">
              <h3>{currentLevel.emoji} {currentLevel.name}</h3>
              <p>Every wish you complete for the first time earns {STARS_PER_WISH} Dream Stars. Daily challenges earn {DAILY_BONUS_STARS} bonus stars.</p>
            </div>
            <strong className="progress-percentage">⭐ {totalStars}</strong>
          </div>
          <div className="progress-track" role="progressbar" aria-label="Progress to next dream level" aria-valuemin={0} aria-valuemax={100} aria-valuenow={levelProgress}>
            <div className="progress-fill" style={{ width: `${levelProgress}%` }} />
          </div>
          <div className="progress-details">
            <span><Trophy size={16} /> Level: {rewardLevels.indexOf(currentLevel) + 1} / {rewardLevels.length}</span>
            <span><CheckCircle2 size={16} /> {rewards.earnedWishIds.length} wishes rewarded</span>
            <span><Sparkles size={16} /> {dailyBonusDates.length} daily bonuses collected</span>
            <span><Sparkles size={16} /> {nextLevel ? `${nextLevel.stars - totalStars} stars to next level` : "Maximum level reached!"}</span>
          </div>
        </div>

        <div className="badges-grid rewards-level-grid">
          {rewardLevels.map((level) => {
            const unlocked = totalStars >= level.stars;
            return (
              <article className={`badge-card ${unlocked ? "badge-unlocked" : "badge-locked"}`} key={level.name}>
                <div className="badge-art"><span>{unlocked ? level.emoji : "🔒"}</span>{unlocked && <span className="badge-check"><CheckCircle2 size={17} /></span>}</div>
                <h3>{level.name}</h3>
                <p>{level.stars === 0 ? "Your journey starts here" : `Earn ${level.stars} Dream Stars`}</p>
                <div className="badge-requirement">{unlocked ? <><CheckCircle2 size={15} /> Level unlocked!</> : <><LockKeyhole size={14} /> {level.stars - totalStars} more stars</>}</div>
                <div className="badge-mini-track"><div className="badge-mini-fill" style={{ width: `${Math.min(100, (totalStars / Math.max(level.stars, 1)) * 100)}%` }} /></div>
              </article>
            );
          })}
        </div>
        <p className="all-badges-unlocked">💖 Tip: each wish awards stars only once. Daily bonus stars are awarded once per day.</p>
      </section>

      <section className="badges-section" id="dream-badges">
        <div className="section-heading">
          <span className="eyebrow">EVERY VICTORY DESERVES A STAR</span>
          <h2>Dream Achievements <span>🏆</span></h2>
          <p>Keep completing your wishes to unlock special badges on your dream journey.</p>
        </div>
        <div className="badges-summary">
          <div className="badges-summary-icon"><Award size={26} /></div>
          <div><strong>{unlockedBadges.length} of {dreamBadges.length} badges unlocked</strong><p>Your completed dreams help you earn new achievements.</p></div>
        </div>
        <div className="badges-grid">
          {dreamBadges.map((badge) => {
            const unlocked = flowerCount >= badge.required;
            return (
              <article className={`badge-card ${unlocked ? "badge-unlocked" : "badge-locked"}`} key={badge.id}>
                <div className="badge-art"><span>{unlocked ? badge.emoji : "🔒"}</span>{unlocked && <span className="badge-check"><CheckCircle2 size={17} /></span>}</div>
                <h3>{badge.title}</h3>
                <p>{badge.description}</p>
                <div className="badge-requirement">{unlocked ? <><CheckCircle2 size={15} /> Badge unlocked!</> : <><LockKeyhole size={14} /> {badge.required - flowerCount} more to go</>}</div>
                <div className="badge-mini-track"><div className="badge-mini-fill" style={{ width: `${Math.min(100, (flowerCount / badge.required) * 100)}%` }} /></div>
              </article>
            );
          })}
        </div>
        {unlockedBadges.length === dreamBadges.length && <p className="all-badges-unlocked">🎉 Dream Legend achieved! You unlocked every badge. Lumi is so proud of you!</p>}
      </section>

      <section className="challenge-section" id="daily-challenge">
        <div className="section-heading">
          <span className="eyebrow">A SMALL STEP EVERY DAY</span>
          <h2>Daily Dream Challenge <span>🌟</span></h2>
          <p>Little actions can make a big difference.</p>
        </div>
        <div className="challenge-card">
          <div className="challenge-art">{challenge.emoji}</div>
          <div className="challenge-content">
            <div className="challenge-pill"><Trophy size={15} /> TODAY'S LITTLE MISSION</div>
            <h3>{challenge.title}</h3>
            <p>{challenge.description}</p>
            {challengeCompleted ? (
              <div className="challenge-done-pill"><CheckCircle2 size={18} /> Challenge completed today!</div>
            ) : (
              <button type="button" className="challenge-button" onClick={completeChallenge}>I did it! <Sparkles size={17} /></button>
            )}
            {challengeMessage && <p className="challenge-feedback">{challengeMessage}</p>}
            <p className="challenge-feedback">🎁 Complete today's challenge to earn {DAILY_BONUS_STARS} Bonus Dream Stars!</p>
          </div>
        </div>
      </section>

      <section className="garden-section" id="dream-garden">
        <div className="section-heading">
          <span className="eyebrow">LOOK HOW YOUR DREAMS GROW</span>
          <h2>Dream Garden <span>🌷</span></h2>
          <p>Every completed wish plants a flower. Keep going and make your garden bloom!</p>
        </div>
        <div className="garden-card">
          <div className="garden-top">
            <div><h3>My little garden</h3><p>{flowerCount === 0 ? "Your garden is waiting for its first flower." : `${flowerCount} ${flowerCount === 1 ? "flower has" : "flowers have"} bloomed from your completed dreams!`}</p></div>
            <div className="flower-counter"><Flower2 size={21} /><strong>{flowerCount}</strong><span>{flowerCount === 1 ? "flower" : "flowers"}</span></div>
          </div>
          <div className={`garden-land ${flowerCount > 0 ? "garden-blooming" : ""}`} aria-label={`Dream garden with ${flowerCount} flowers`}>
            <div className="garden-sun">☀️</div><div className="garden-cloud garden-cloud-one">☁️</div><div className="garden-cloud garden-cloud-two">☁️</div><div className="garden-ground" />
            {flowerCount === 0 ? (
              <div className="empty-garden"><span>🌱</span><p>Complete a wish to grow your first flower!</p></div>
            ) : (
              <div className="flower-field">
                {completedWishes.map((wish, index) => {
                  const flowers = ["🌷", "🌼", "🌸", "🌻", "💐", "🌺", "🪻"];
                  return (
                    <button type="button" className={`garden-flower ${selectedWish === wish.text ? "flower-selected" : ""}`} key={wish.id} onClick={() => selectGardenWish(wish)} aria-label={`View completed dream: ${wish.text}`} title={wish.text} style={{ left: `${8 + ((index * 17 + 7) % 84)}%`, animationDelay: `${(index % 8) * 0.12}s` }}>
                      <span className="flower-emoji">{flowers[index % flowers.length]}</span><span className="flower-stem" />
                    </button>
                  );
                })}
              </div>
            )}
            <div className="garden-butterfly butterfly-one">🦋</div><div className="garden-butterfly butterfly-two">🦋</div>
          </div>
          {selectedWish && <div className="selected-wish-card"><span>🌸 Your bloomed dream</span><p>{selectedWish}</p><button type="button" onClick={() => setSelectedWish("")}>Close</button></div>}
          <div className="garden-footer"><span>🌿 Every little win deserves to bloom.</span><a href="#wish-box">View my wishes <Heart size={15} /></a></div>
        </div>
      </section>

      <section className="wish-section" id="wish-box">
        <div className="section-heading">
          <span className="eyebrow">YOUR DREAMS MATTER</span>
          <h2>Dream Wish Box <span>💌</span></h2>
          <p>Write a wish, take a step, and watch your garden grow.</p>
        </div>
        <div className="wish-panel">
          <form className="wish-form" onSubmit={addWish}>
            <label htmlFor="wish-input">What is one dream in your heart?</label>
            <div className="wish-input-row">
              <input id="wish-input" type="text" value={wishInput} onChange={(event) => setWishInput(event.target.value)} placeholder="I dream of..." maxLength={180} />
              <button type="submit" className="add-wish-button"><Plus size={18} /> Plant wish</button>
            </div>
          </form>
          <div className="wish-list-heading">
            <h3>Your wishes <span>({wishes.length})</span></h3>
            {wishes.length > 0 && <button type="button" className="clear-button" onClick={clearWishes}><RotateCcw size={14} /> Clear all</button>}
          </div>
          {wishes.length === 0 ? (
            <div className="empty-wishes"><span>🌱</span><h3>A little space for a big dream</h3><p>Your first wish can start growing right here.</p></div>
          ) : (
            <div className="wish-list">
              {wishes.map((wish) => (
                <article className={`wish-card ${wish.completed ? "wish-completed" : ""}`} key={wish.id}>
                  <button type="button" className="wish-check" onClick={() => toggleWish(wish.id)} aria-label={wish.completed ? `Mark ${wish.text} as not completed` : `Mark ${wish.text} as completed`} title={wish.completed ? "Mark as not completed" : "Mark as completed"}>
                    {wish.completed ? <CheckCircle2 size={22} /> : <span className="empty-check" />}
                  </button>
                  <div className="wish-text-wrap"><p className="wish-text">{wish.text}</p><span className="wish-status">{wish.completed ? "Bloomed in your garden 🌸" : "Still growing 🌱"}</span></div>
                  <button type="button" className="delete-wish-button" onClick={() => deleteWish(wish.id)} aria-label={`Delete wish: ${wish.text}`} title="Delete wish"><Trash2 size={17} /></button>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="moon-secret-section">
        <button type="button" className="moon-secret-button" onClick={moonSecret}>🌙 Tap the moon for a secret</button>
      </section>

      <footer className="footer">
        <div className="footer-cloud">☁️</div>
        <p>Made with <span>♥</span> for every little dreamer.</p>
        <small>Keep dreaming. Keep growing. Keep being you. ✨</small>
      </footer>

      {celebration && (
        <div className="achievement-celebration-overlay" role="dialog" aria-modal="true" aria-labelledby="celebration-title" onClick={() => setCelebration(null)}>
          <style>{`
            .achievement-celebration-overlay{position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;background:rgba(35,20,55,.62);backdrop-filter:blur(8px);animation:celebrationFadeIn .25s ease both}
            .achievement-celebration-card{position:relative;width:min(100%,430px);padding:36px 28px 30px;text-align:center;border:1px solid rgba(255,255,255,.8);border-radius:30px;background:linear-gradient(145deg,#fff8fc,#f4f0ff 55%,#eafaff);box-shadow:0 25px 90px rgba(20,10,50,.3);animation:celebrationPop .55s cubic-bezier(.2,1.4,.4,1) both;overflow:hidden}
            .achievement-celebration-card:before,.achievement-celebration-card:after{content:'✦  ✧  ·  ✦  ·  ✧';position:absolute;left:0;right:0;color:#e9a8d1;font-size:18px;letter-spacing:10px;opacity:.8;pointer-events:none}
            .achievement-celebration-card:before{top:12px}.achievement-celebration-card:after{bottom:12px}
            .celebration-trophy{width:112px;height:112px;margin:8px auto 20px;display:grid;place-items:center;border-radius:50%;background:linear-gradient(135deg,#ffe1f0,#e5ddff,#d8f7ff);box-shadow:0 10px 35px rgba(173,126,204,.25);font-size:62px;animation:celebrationFloat 2s ease-in-out infinite}
            .celebration-kicker{margin:0 0 8px;color:#a45b9b;font-size:12px;font-weight:800;letter-spacing:2px;text-transform:uppercase}
            .achievement-celebration-card h2{margin:0 0 10px;color:#4b3568;font-size:clamp(25px,6vw,34px);line-height:1.15}
            .achievement-celebration-card p{margin:0 auto 12px;max-width:320px;color:#6b5b7e;line-height:1.6}
            .celebration-reward{font-weight:700;color:#a45b9b!important}
            .celebration-close{margin-top:8px;padding:12px 24px;border:0;border-radius:999px;background:linear-gradient(90deg,#ec8fc5,#a995f7);color:white;font:inherit;font-weight:800;cursor:pointer;box-shadow:0 7px 18px rgba(169,120,201,.3);transition:transform .2s ease}
            .celebration-close:hover{transform:translateY(-2px) scale(1.02)}
            .celebration-sparkle{position:absolute;font-size:24px;animation:celebrationTwinkle 1.4s ease-in-out infinite alternate}
            .celebration-sparkle.one{left:24px;top:65px}.celebration-sparkle.two{right:28px;top:82px;animation-delay:.3s}.celebration-sparkle.three{left:38px;bottom:78px;animation-delay:.6s}.celebration-sparkle.four{right:36px;bottom:72px;animation-delay:.2s}
            @keyframes celebrationFadeIn{from{opacity:0}to{opacity:1}}
            @keyframes celebrationPop{from{opacity:0;transform:translateY(25px) scale(.72)}to{opacity:1;transform:translateY(0) scale(1)}}
            @keyframes celebrationFloat{0%,100%{transform:translateY(0) rotate(-3deg)}50%{transform:translateY(-8px) rotate(3deg)}}
            @keyframes celebrationTwinkle{from{transform:scale(.7) rotate(-15deg);opacity:.5}to{transform:scale(1.2) rotate(15deg);opacity:1}}
            @media(prefers-reduced-motion:reduce){.achievement-celebration-overlay,.achievement-celebration-card,.celebration-trophy,.celebration-sparkle{animation:none}}
          `}</style>
          <div className="achievement-celebration-card" onClick={(event) => event.stopPropagation()}>
            <span className="celebration-sparkle one">✨</span><span className="celebration-sparkle two">🌟</span><span className="celebration-sparkle three">💖</span><span className="celebration-sparkle four">✦</span>
            <div className="celebration-trophy" aria-hidden="true">{celebration.emoji}</div>
            <p className="celebration-kicker">A magical achievement!</p>
            <h2 id="celebration-title">{celebration.title}</h2>
            <p>{celebration.description}</p>
            <p className="celebration-reward">{celebration.reward}</p>
            <button type="button" className="celebration-close" onClick={() => setCelebration(null)}>Keep Dreaming 💗</button>
          </div>
        </div>
      )}
    </main>
  );
}
