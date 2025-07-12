import React, { useState, useEffect, useReducer, useRef } from 'https://esm.sh/react@18';
import ReactDOM from 'https://esm.sh/react-dom@18';
import { BrowserRouter, Routes, Route, useNavigate } from 'https://esm.sh/react-router-dom@6';
import Chart from 'https://esm.sh/chart.js@4';
import { gsap } from 'https://esm.sh/gsap@3';
import lottie from 'https://esm.sh/lottie-web@5';

// 状态管理
const initialState = {
  lang: localStorage.getItem('lang') || 'zh',
  motivation: parseInt(localStorage.getItem('motivation')) || 100,
  checkins: JSON.parse(localStorage.getItem('checkins')) || { study: [], sleep: [], work: [], custom: [] },
  achievements: JSON.parse(localStorage.getItem('achievements')) || [],
  pet: localStorage.getItem('pet') || 'cat',
  dress: JSON.parse(localStorage.getItem('dress')) || { hat: false, shirt: false },
  settings: JSON.parse(localStorage.getItem('settings')) || { notifications: true, sound: true, theme: 'auto' },
  weather: localStorage.getItem('weather') || 'sunny'
};

function reducer(state, action) {
  try {
    switch (action.type) {
      case 'SET_LANG': localStorage.setItem('lang', action.payload); return { ...state, lang: action.payload };
      case 'CHECK_IN': const newCheckins = { ...state.checkins, [action.payload.type]: [...state.checkins[action.payload.type], { time: action.payload.time, success: true }] }; localStorage.setItem('checkins', JSON.stringify(newCheckins)); return { ...state, checkins: newCheckins, motivation: Math.min(state.motivation + 10, 100) };
      case 'ADD_CUSTOM': if (!state.checkins[action.payload]) { const newCheckins = { ...state.checkins, [action.payload]: [] }; localStorage.setItem('checkins', JSON.stringify(newCheckins)); return { ...state, checkins: newCheckins }; } return state;
      case 'SET_DRESS': if (state.motivation >= 50) { const newDress = { ...state.dress, [action.payload]: true }; localStorage.setItem('dress', JSON.stringify(newDress)); return { ...state, dress: newDress, motivation: state.motivation - 50 }; } return state;
      case 'ADD_ACHIEVEMENT': if (!state.achievements.includes(action.payload)) { const newAchievements = [...state.achievements, action.payload]; localStorage.setItem('achievements', JSON.stringify(newAchievements)); return { ...state, achievements: newAchievements }; } return state;
      case 'UPDATE_SETTINGS': localStorage.setItem('settings', JSON.stringify(action.payload)); return { ...state, settings: action.payload };
      case 'DECREMENT_MOTIVATION': const newMotivation = Math.max(state.motivation - 10, 0); localStorage.setItem('motivation', newMotivation); return { ...state, motivation: newMotivation };
      case 'SET_WEATHER': localStorage.setItem('weather', action.payload); return { ...state, weather: action.payload };
      default: return state;
    }
  } catch (e) { console.error('状态更新错误:', e); return state; }
}

// 语言包
const i18n = {
  zh: { greeting: { morning: '清晨好，准备开启新一天！', afternoon: '下午好，继续加油！', evening: '晚上好，放松一下吧！' }, checkin: '打卡', stats: '统计', achievements: '成就', settings: '设置', bubble: ['主人，该打卡啦！', '花园需要你的爱！', '宠物想你了哦！', '昨晚只睡6小时，快补觉！'], notifications: '通知', sound: '音效', theme: '主题', themeOptions: { auto: '自动', light: '浅色', dark: '深色' } },
  en: { greeting: { morning: 'Good morning, start a new day!', afternoon: 'Good afternoon, keep it up!', evening: 'Good evening, time to relax!' }, checkin: 'Check-in', stats: 'Stats', achievements: 'Achievements', settings: 'Settings', bubble: ['Time to check in!', 'Your garden needs love!', 'Your pet misses you!', 'Only 6 hours of sleep last night? Rest up!'], notifications: 'Notifications', sound: 'Sound', theme: 'Theme', themeOptions: { auto: 'Auto', light: 'Light', dark: 'Dark' } }
};

// 天气API调用
async function fetchWeather(apiKey) {
  try {
    const res = await fetch(`https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=auto:ip`);
    const data = await res.json();
    return data.current.condition.text.toLowerCase();
  } catch (e) {
    console.error('天气API错误:', e);
    return 'sunny'; // 失败默认晴天
  }
}

// 时钟组件
function Clock({ dispatch }) {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const hours = time.getHours();
  const minutes = time.getMinutes();
  const seconds = time.getSeconds();
  const hourDeg = (hours % 12 + minutes / 60) * 30;
  const minuteDeg = minutes * 6;
  const secondDeg = seconds * 6;

  return (
    <div className="clock">
      <svg className="clock-face" width="100" height="100" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="45" fill="none" stroke="#333" strokeWidth="4" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.2))"/>
        <line id="hour-hand" x1="50" y1="50" x2="50" y2="30" stroke="#333" strokeWidth="4" transform={`rotate(${hourDeg} 50 50)`}/>
        <line id="minute-hand" x1="50" y1="50" x2="50" y2="20" stroke="#333" strokeWidth="2" transform={`rotate(${minuteDeg} 50 50)`}/>
        <line id="second-hand" x1="50" y1="50" x2="50" y2="25" stroke="#FF4500" strokeWidth="1" transform={`rotate(${secondDeg} 50 50)`}/>
      </svg>
      <span id="time-text">{`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`}</span>
    </div>
  );
}

// 首页
function Home({ state, dispatch }) {
  const [bubble, setBubble] = useState('');
  const navigate = useNavigate();
  const hours = new Date().getHours();
  const motivationStatus = state.motivation > 70 ? 'high' : state.motivation < 30 ? 'low' : 'normal';

  useEffect(() => {
    gsap.from('.container', { opacity: 0, scale: 0.8, duration: 7, ease: 'power2.out' });
    gsap.from('.flower', { y: 100, opacity: 0, stagger: 0.5, duration: 2, delay: 1 });
    gsap.from('.pet', { x: 200, opacity: 0, duration: 2, delay: 3 });

    lottie.loadAnimation({
      container: document.querySelector('.opening-animation'),
      path: 'assets/opening-animation.json',
      renderer: 'svg',
      loop: false,
      autoplay: true
    });

    fetchWeather('YOUR_API_KEY').then(weather => dispatch({ type: 'SET_WEATHER', payload: weather }));

    const bubbleTimer = setInterval(() => {
      const messages = i18n[state.lang].bubble;
      const aiMessage = state.checkins.sleep.length && new Date(state.checkins.sleep[state.checkins.sleep.length - 1].time).getHours() < 6 ?
        i18n[state.lang].bubble[3] : messages[Math.floor(Math.random() * messages.length)];
      setBubble(aiMessage);
      if ('vibrate' in navigator) navigator.vibrate(50);
      setTimeout(() => setBubble(''), 5000);
    }, Math.random() * (10 - 5) * 60 * 1000 + 5 * 60 * 1000);

    const lastCheck = localStorage.getItem('lastCheck') || new Date().toDateString();
    if (lastCheck !== new Date().toDateString()) {
      dispatch({ type: 'DECREMENT_MOTIVATION' });
      localStorage.setItem('lastCheck', new Date().toDateString());
    }

    return () => clearInterval(bubbleTimer);
  }, [state.lang, state.checkins]);

  const handleCheckIn = (type) => {
    dispatch({ type: 'CHECK_IN', payload: { type, time: new Date().toISOString() } });
    const flower = document.querySelector(`.flower[data-type="${type}"]`);
    if (flower) {
      gsap.to(flower, { scale: 1.2, duration: 0.5, yoyo: true, repeat: 1 });
      for (let i = 0; i < 10; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        flower.appendChild(particle);
        gsap.to(particle, { x: (Math.random() - 0.5) * 100, y: (Math.random() - 0.5) * 100, opacity: 0, duration: 1, onComplete: () => particle.remove() });
      }
      if ('vibrate' in navigator) navigator.vibrate(100);
      if (state.settings.sound) new Audio('assets/sound-wind.mp3').play();
    }
  };

  return (
    <div className={`page ${state.weather}`} data-motivation={motivationStatus}>
      <div className="opening-animation"></div>
      <div className="greeting">{hours < 12 ? i18n[state.lang].greeting.morning : hours < 18 ? i18n[state.lang].greeting.afternoon : i18n[state.lang].greeting.evening}</div>
      <div className="garden">
        <div className="flower" data-type="study" style={{ backgroundImage: `url('assets/sunflower.svg')` }} onClick={() => handleCheckIn('study')}></div>
        <div className="flower" data-type="sleep" style={{ backgroundImage: `url('assets/lavender.svg')` }} onClick={() => handleCheckIn('sleep')}></div>
        <div className="flower" data-type="work" style={{ backgroundImage: `url('assets/rose.svg')` }} onClick={() => handleCheckIn('work')}></div>
      </div>
      <div className="pet" style={{ backgroundImage: `url('assets/pet-${state.pet}${state.dress.hat ? '-hat' : ''}.svg')` }} onClick={() => {
        gsap.to('.pet', { rotation: 360, duration: 1 });
        navigate('/achievements');
      }}></div>
      {bubble && <div className="bubble"><span>{bubble}</span></div>}
      <div className="motivation">动力值: <span>{state.motivation}</span></div>
    </div>
  );
}

// 打卡页面
function CheckIn({ state, dispatch }) {
  const [customType, setCustomType] = useState('');

  const handleCheckIn = (type) => {
    dispatch({ type: 'CHECK_IN', payload: { type, time: new Date().toISOString() } });
    const flower = document.querySelector(`.flower[data-type="${type}"]`);
    if (flower) {
      gsap.to(flower, { scale: 1.2, duration: 0.5, yoyo: true, repeat: 1 });
      for (let i = 0; i < 10; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        flower.appendChild(particle);
        gsap.to(particle, { x: (Math.random() - 0.5) * 100, y: (Math.random() - 0.5) * 100, opacity: 0, duration: 1, onComplete: () => particle.remove() });
      }
      if ('vibrate' in navigator) navigator.vibrate(100);
      if (state.settings.sound) new Audio('assets/sound-wind.mp3').play();
    }
  };

  const addCustom = () => {
    if (customType && !state.checkins[customType]) {
      dispatch({ type: 'ADD_CUSTOM', payload: customType });
      setCustomType('');
    }
  };

  return (
    <div className="page">
      <h2>{i18n[state.lang].checkin}</h2>
      <div className="checkin-list">
        {['study', 'sleep', 'work', ...Object.keys(state.checkins).filter(k => k.startsWith('custom'))].map(type => (
          <div className="checkin-item" key={type}>
            <span>{type}</span>
            <button onClick={() => handleCheckIn(type)}>{i18n[state.lang].checkin}</button>
          </div>
        ))}
        <div className="checkin-item">
          <input type="text" value={customType} onChange={e => setCustomType(e.target.value)} placeholder={i18n[state.lang].checkin} />
          <button onClick={addCustom}>添加</button>
        </div>
      </div>
    </div>
  );
}

// 统计页面
function Stats({ state }) {
  useEffect(() => {
    const ctx1 = document.getElementById('stats-chart-sleep').getContext('2d');
    new Chart(ctx1, {
      type: 'line',
      data: {
        labels: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
        datasets: [{
          label: i18n[state.lang].checkin + ' (小时)',
          data: state.checkins.sleep.map(c => new Date(c.time).getHours() || Math.random() * 8),
          borderColor: '#4A90E2',
          backgroundColor: 'rgba(74, 144, 226, 0.2)',
          fill: true
        }]
      },
      options: {
        responsive: true,
        plugins: { title: { display: true, text: i18n[state.lang].stats + ' - 睡眠趋势' } },
        scales: { y: { beginAtZero: true, title: { display: true, text: '小时' } } }
      }
    });
  }, [state.lang, state.checkins]);

  return (
    <div className="page">
      <h2>{i18n[state.lang].stats}</h2>
      <div className="chart-tabs">
        <button>每日</button>
        <button>每周</button>
        <button>每月</button>
      </div>
      <canvas id="stats-chart-sleep"></canvas>
    </div>
  );
}

// 成就页面
function Achievements({ state, dispatch }) {
  const achievements = [
    { id: 'study7', zh: '7天学习达人', en: '7-Day Study Master', condition: state.checkins.study.length >= 7 },
    { id: 'streak30', zh: '连续打卡30天', en: '30-Day Streak', condition: state.checkins.study.length >= 30 }
  ];

  useEffect(() => {
    achievements.forEach(a => {
      if (a.condition && !state.achievements.includes(a.id)) {
        dispatch({ type: 'ADD_ACHIEVEMENT', payload: a.id });
        if (state.settings.sound) new Audio('assets/sound-wind.mp3').play();
      }
    });
  }, [state.checkins]);

  return (
    <div className="page">
      <h2>{i18n[state.lang].achievements}</h2>
      <div className="achievements-list">
        {achievements.map(a => (
          <div className={`achievement ${state.achievements.includes(a.id) ? 'unlocked' : ''}`} key={a.id}>
            <span>{i18n[state.lang][a.id] || a[state.lang]}</span>
            <span className="status">{state.achievements.includes(a.id) ? '已解锁' : '未解锁'}</span>
          </div>
        ))}
      </div>
      <div className="pet-dressup">
        <h3>{i18n[state.lang].achievements}</h3>
        <div className="dressup-options">
          <button onClick={() => dispatch({ type: 'SET_DRESS', payload: 'hat' })}>帽子</button>
          <button onClick={() => dispatch({ type: 'SET_DRESS', payload: 'shirt' })}>衣服</button>
        </div>
      </div>
    </div>
  );
}

// 设置页面
function Settings({ state, dispatch }) {
  const handleSettingsChange = (key, value) => {
    dispatch({ type: 'UPDATE_SETTINGS', payload: { ...state.settings, [key]: value } });
    if (state.settings.sound && key === 'sound' && value) new Audio('assets/sound-wind.mp3').play();
  };

  return (
    <div className="page">
      <h2>{i18n[state.lang].settings}</h2>
      <div className="settings-list">
        <div className="setting-item">
          <span>{i18n[state.lang].notifications}</span>
          <input type="checkbox" checked={state.settings.notifications} onChange={e => handleSettingsChange('notifications', e.target.checked)} />
        </div>
        <div className="setting-item">
          <span>{i18n[state.lang].sound}</span>
          <input type="checkbox" checked={state.settings.sound} onChange={e => handleSettingsChange('sound', e.target.checked)} />
        </div>
        <div className="setting-item">
          <span>{i18n[state.lang].theme}</span>
          <select value={state.settings.theme} onChange={e => handleSettingsChange('theme', e.target.value)}>
            {Object.keys(i18n[state.lang].themeOptions).map(key => (
              <option key={key} value={key}>{i18n[state.lang].themeOptions[key]}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

// 小游戏
function Game({ state, dispatch }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const particles = [];

    const addParticle = (x, y) => {
      particles.push({ x, y, size: 10, speed: Math.random() * 5 + 2, opacity: 1 });
      dispatch({ type: 'CHECK_IN', payload: { type: 'game', time: new Date().toISOString() } });
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p, i) => {
        p.y -= p.speed;
        p.opacity -= 0.02;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 215, 0, ${p.opacity})`;
        ctx.fill();
        if (p.opacity <= 0) particles.splice(i, 1);
      });
      requestAnimationFrame(animate);
    };

    canvas.addEventListener('click', e => {
      const rect = canvas.getBoundingClientRect();
      addParticle(e.clientX - rect.left, e.clientY - rect.top);
      if ('vibrate' in navigator) navigator.vibrate(50);
      if (state.settings.sound) new Audio('assets/sound-wind.mp3').play();
    });

    animate();
  }, [state.settings.sound]);

  return (
    <div className="page">
      <h2>{i18n[state.lang].checkin} - 花瓣游戏</h2>
      <canvas ref={canvasRef} width="400" height="400"></canvas>
    </div>
  );
}

// 主应用
function App() {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    document.body.className = state.settings.theme === 'auto' ?
      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') :
      state.settings.theme;

    if (state.settings.notifications && 'Notification' in window && Notification.permission === 'granted') {
      const hours = new Date().getHours();
      if (hours === 8 || hours === 14 || hours === 20) {
        new Notification(i18n[state.lang].bubble[Math.floor(Math.random() * i18n[state.lang].bubble.length)]);
      }
    }
  }, [state.settings]);

  return (
    <BrowserRouter>
      <div className="container">
        <Clock dispatch={dispatch} />
        <div className="lang-switch">
          <button onClick={() => dispatch({ type: 'SET_LANG', payload: 'zh' })}>中文</button>
          <button onClick={() => dispatch({ type: 'SET_LANG', payload: 'en' })}>English</button>
        </div>
        <Routes>
          <Route path="/" element={<Home state={state} dispatch={dispatch} />} />
          <Route path="/checkin" element={<CheckIn state={state} dispatch={dispatch} />} />
          <Route path="/stats" element={<Stats state={state} />} />
          <Route path="/achievements" element={<Achievements state={state} dispatch={dispatch} />} />
          <Route path="/settings" element={<Settings state={state} dispatch={dispatch} />} />
          <Route path="/game" element={<Game state={state} dispatch={dispatch} />} />
        </Routes>
        <div className="nav">
          <button onClick={() => window.location.href = '/'}>首页</button>
          <button onClick={() => window.location.href = '/checkin'}>打卡</button>
          <button onClick={() => window.location.href = '/stats'}>统计</button>
          <button onClick={() => window.location.href = '/achievements'}>成就</button>
          <button onClick={() => window.location.href = '/settings'}>设置</button>
          <button onClick={() => window.location.href = '/game'}>游戏</button>
        </div>
      </div>
    </BrowserRouter>
  );
}

ReactDOM.render(<App />, document.getElementById('main-container'));
