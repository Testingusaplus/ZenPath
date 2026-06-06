/**
 * Bloom Wellness Organizer - Application Logic
 * 
 * Implements core features:
 * - Application State & LocalStorage Persistence
 * - Sidebar Routing & Navigation
 * - Daily Check-In Logger (Mood, Energy, Gratitude, Goals)
 * - Interactive Calendar & Historical Log View
 * - Habit Tracker with streak calculations
 * - Reflective Journal with dynamic daily prompts
 * - Simulated Monetization Hub (AdMob, Affiliates, Gumroad, Tip Jar)
 * - Automated Passive Income Traffic Simulator
 * - Custom HTML5 Canvas Chart Rendering (Earnings trajectory)
 */

// ==========================================
// 1. APPLICATION STATE
// ==========================================
const BloomState = {
  theme: 'theme-sage',
  premium: false,
  selectedDate: '', // Format: YYYY-MM-DD
  dailyLogs: {}, // Key: YYYY-MM-DD, Value: { mood, energy, gratitude, focus }
  reminders: {}, // Key: YYYY-MM-DD, Value: Array of strings
  habits: [
    { id: 'h1', name: 'Meditate for 10 minutes', category: 'mental', checkedDates: [], streak: 0 },
    { id: 'h2', name: 'Drink 8 cups of water', category: 'physical', checkedDates: [], streak: 0 },
    { id: 'h3', name: 'Log mood & energy', category: 'mental', checkedDates: [], streak: 0 }
  ],
  journalEntries: [
    { id: 'j1', date: '2026-06-05', prompt: 'What brought you a moment of peace today?', entry: 'Enjoyed a quiet coffee in the morning before the day rushed in. Watched the rain tap against the window.' }
  ],
  earnings: {
    ads: 0.00,
    affiliates: 0.00,
    digital: 0.00,
    tips: 0.00
  },
  trafficStats: {
    downloads: 12450,
    activeUsers: 2180,
    impressions: 0
  },
  simulationActive: false,
  simulationInterval: null,
  
  // Save state to localStorage
  save() {
    localStorage.setItem('bloom_state', JSON.stringify({
      theme: this.theme,
      premium: this.premium,
      dailyLogs: this.dailyLogs,
      reminders: this.reminders,
      habits: this.habits,
      journalEntries: this.journalEntries,
      earnings: this.earnings,
      trafficStats: this.trafficStats
    }));
    this.updateSidebarEarnings();
  },

  // Load state from localStorage
  load() {
    const saved = localStorage.getItem('bloom_state');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.theme) this.theme = parsed.theme;
        if (parsed.premium !== undefined) this.premium = parsed.premium;
        if (parsed.dailyLogs) this.dailyLogs = parsed.dailyLogs;
        if (parsed.reminders) this.reminders = parsed.reminders;
        if (parsed.habits) this.habits = parsed.habits;
        if (parsed.journalEntries) this.journalEntries = parsed.journalEntries;
        if (parsed.earnings) this.earnings = parsed.earnings;
        if (parsed.trafficStats) this.trafficStats = parsed.trafficStats;
      } catch (e) {
        console.error("Error loading localStorage state:", e);
      }
    }
    this.updateSidebarEarnings();
  },

  updateSidebarEarnings() {
    const total = this.earnings.ads + this.earnings.affiliates + this.earnings.digital + this.earnings.tips;
    const element = document.getElementById('sidebar-earnings');
    if (element) element.innerText = `$${total.toFixed(2)}`;
  }
};

// Get formatted date string for today
function getTodayString() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Format date for readable display (e.g. June 6, 2026)
function formatReadableDate(dateStr) {
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const d = new Date(parts[0], parts[1] - 1, parts[2]);
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

// ==========================================
// 2. ROUTING & UI NAVIGATION
// ==========================================
const Router = {
  init() {
    // Navigation Tabs
    document.querySelectorAll('.nav-item').forEach(button => {
      button.addEventListener('click', () => {
        const tabName = button.getAttribute('data-tab');
        this.switchTab(tabName);
        
        // On mobile, close menu after selection
        document.querySelector('.sidebar-panel').classList.remove('menu-open');
      });
    });

    // Quick links on dashboard
    document.querySelectorAll('[data-go-tab]').forEach(link => {
      link.addEventListener('click', () => {
        const tabName = link.getAttribute('data-go-tab');
        this.switchTab(tabName);
      });
    });

    // Mobile menu triggers
    const mobileOpen = document.getElementById('mobile-menu-open');
    const mobileClose = document.getElementById('mobile-menu-close');
    const sidebar = document.querySelector('.sidebar-panel');

    if (mobileOpen && mobileClose && sidebar) {
      mobileOpen.addEventListener('click', () => sidebar.classList.add('menu-open'));
      mobileClose.addEventListener('click', () => sidebar.classList.remove('menu-open'));
    }

    // Set page subtitle on load
    this.updateHeaderDetails();
  },

  switchTab(tabName) {
    // Deactivate all views
    document.querySelectorAll('.tab-view').forEach(view => view.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));

    // Activate selected view
    const targetView = document.getElementById(`view-${tabName}`);
    const targetNav = document.querySelector(`.nav-item[data-tab="${tabName}"]`);
    
    if (targetView && targetNav) {
      targetView.classList.add('active');
      targetNav.classList.add('active');
    }

    // Update Header titles
    const titleMap = {
      'dashboard': { title: 'Mindfulness Center', subtitle: 'Log check-ins and review your daily wellness summary.' },
      'calendar': { title: 'Wellness Calendar & Log', subtitle: 'View historic wellness entries and check-in history.' },
      'habits': { title: 'Habit & Routines Tracker', subtitle: 'Check off daily habits and maintain your focus streaks.' },
      'journal': { title: 'Mindful Journal', subtitle: 'Reflective writing space with supportive daily prompts.' },
      'store': { title: 'Passive Income Storefront', subtitle: 'An active simulation of passive income monetization.' },
      'analytics': { title: 'Creator Analytics Dashboard', subtitle: 'Real-time monitoring of app downloads, traffic, and simulated earnings.' }
    };

    const headerTitle = document.getElementById('page-title');
    const headerSub = document.getElementById('page-subtitle');
    
    if (headerTitle && headerSub && titleMap[tabName]) {
      headerTitle.innerText = titleMap[tabName].title;
      headerSub.innerText = titleMap[tabName].subtitle;
    }

    // Trigger tab-specific renders
    if (tabName === 'dashboard') {
      DashboardModule.render();
    } else if (tabName === 'calendar') {
      CalendarModule.renderCalendar();
    } else if (tabName === 'habits') {
      HabitModule.render();
    } else if (tabName === 'journal') {
      JournalModule.render();
    } else if (tabName === 'store') {
      StoreModule.render();
    } else if (tabName === 'analytics') {
      AnalyticsModule.render();
    }
  },

  updateHeaderDetails() {
    const today = new Date();
    const options = { weekday: 'long', month: 'short', day: 'numeric' };
    const dateStr = today.toLocaleDateString('en-US', options);
    const dashSub = document.getElementById('page-subtitle');
    if (dashSub && document.getElementById('view-dashboard').classList.contains('active')) {
      dashSub.innerText = `Today is ${dateStr}. Maintain your wellness focus.`;
    }
  }
};

// ==========================================
// 3. FOCUS TIMER MODULE (POMODORO)
// ==========================================
const TimerModule = {
  timeLeft: 25 * 60, // 25 minutes standard
  duration: 25 * 60,
  timerId: null,
  type: 'focus', // focus, short, long
  isRunning: false,

  init() {
    const playBtn = document.getElementById('timer-play-btn');
    const resetBtn = document.getElementById('timer-reset-btn');
    
    if (playBtn) playBtn.addEventListener('click', () => this.toggle());
    if (resetBtn) resetBtn.addEventListener('click', () => this.reset());

    document.querySelectorAll('.timer-type-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.timer-type-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const type = btn.getAttribute('data-type');
        this.setTimerType(type);
      });
    });

    // Fast-forward testing helper
    const display = document.getElementById('timer-display');
    if (display) {
      display.style.cursor = 'pointer';
      display.title = 'Click while paused to set to 10s for quick testing';
      display.addEventListener('click', () => {
        if (!this.isRunning) {
          this.timeLeft = 10;
          this.updateUI();
          showNotification("⏰ Timer fast-forwarded to 10 seconds for quick testing.");
        }
      });
    }

    this.updateUI();
  },

  setTimerType(type) {
    this.type = type;
    this.stop();
    if (type === 'focus') {
      this.duration = 25 * 60;
    } else if (type === 'short') {
      this.duration = 5 * 60;
    } else if (type === 'long') {
      this.duration = 15 * 60;
    }
    this.timeLeft = this.duration;
    this.updateUI();
  },

  toggle() {
    if (this.isRunning) {
      this.stop();
    } else {
      this.start();
    }
  },

  start() {
    this.isRunning = true;
    const playIcon = document.getElementById('timer-play-icon');
    if (playIcon) {
      playIcon.innerHTML = '<rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect>';
    }
    
    this.timerId = setInterval(() => {
      this.timeLeft--;
      this.updateUI();
      
      if (this.timeLeft <= 0) {
        this.complete();
      }
    }, 1000);
  },

  stop() {
    this.isRunning = false;
    const playIcon = document.getElementById('timer-play-icon');
    if (playIcon) {
      playIcon.innerHTML = '<polygon points="5 3 19 12 5 21 5 3"></polygon>';
    }
    clearInterval(this.timerId);
  },

  reset() {
    this.stop();
    this.timeLeft = this.duration;
    this.updateUI();
  },

  complete() {
    this.stop();
    this.playAlarmSound();
    
    // Add completed minutes to analytics
    let minutes = Math.floor(this.duration / 60);
    
    // Simulate active user experience points
    showNotification(`⏰ Timer complete! You focused for ${minutes} minutes.`);
    
    // Auto reward simulated ad impression since user stayed active on screen
    MonetizationSimulator.trackImpression();
    
    this.reset();
  },

  updateUI() {
    const minutes = Math.floor(this.timeLeft / 60);
    const seconds = this.timeLeft % 60;
    const displayStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    
    const display = document.getElementById('timer-display');
    if (display) display.innerText = displayStr;

    // Update circular progress SVG
    const circle = document.getElementById('timer-progress');
    if (circle) {
      const radius = circle.r.baseVal.value;
      const circumference = radius * 2 * Math.PI;
      const percentLeft = this.timeLeft / this.duration;
      const offset = circumference * (1 - percentLeft);
      circle.style.strokeDashoffset = offset;
    }

    // Update document title
    document.title = this.isRunning ? `(${displayStr}) Bloom Wellness` : 'Bloom Wellness Organizer';
  },

  playAlarmSound() {
    // Generate a beautiful gentle chime procedurally using Web Audio API!
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const now = ctx.currentTime;
      
      const playTone = (freq, delay, dur) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + delay);
        
        gain.gain.setValueAtTime(0, now + delay);
        gain.gain.linearRampToValueAtTime(0.3, now + delay + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + delay + dur);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + delay);
        osc.stop(now + delay + dur);
      };

      // Gentle ascending major triad arpeggio
      playTone(523.25, 0.0, 1.5); // C5
      playTone(659.25, 0.15, 1.5); // E5
      playTone(783.99, 0.3, 1.5); // G5
      playTone(1046.50, 0.45, 2.0); // C6
    } catch (e) {
      console.warn("Audio Context blocked or not supported:", e);
    }
  }
};

// ==========================================
// 4. DAILY WELLNESS CHECK-IN & CALENDAR
// ==========================================
const CalendarModule = {
  currentDate: new Date(),
  loggingDate: null,

  init() {
    // Slider values synchronization
    const moodSlider = document.getElementById('checkin-mood');
    const moodVal = document.getElementById('mood-val');
    if (moodSlider && moodVal) {
      moodSlider.addEventListener('input', (e) => {
        moodVal.innerText = e.target.value;
      });
    }

    const energySlider = document.getElementById('checkin-energy');
    const energyVal = document.getElementById('energy-val');
    if (energySlider && energyVal) {
      energySlider.addEventListener('input', (e) => {
        energyVal.innerText = e.target.value;
      });
    }

    // Modal Triggers
    const dashCheckin = document.getElementById('dash-checkin-btn');
    const checkinClose = document.getElementById('checkin-modal-close');
    const checkinModal = document.getElementById('checkin-modal');

    if (dashCheckin) {
      dashCheckin.addEventListener('click', () => {
        this.loggingDate = null; // Default today
        document.getElementById('checkin-gratitude').value = '';
        document.getElementById('checkin-focus').value = '';
        checkinModal.classList.add('active');
      });
    }

    if (checkinClose) {
      checkinClose.addEventListener('click', () => {
        checkinModal.classList.remove('active');
      });
    }

    // Form Submission
    const checkinForm = document.getElementById('checkin-form');
    if (checkinForm) {
      checkinForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.saveCheckin();
      });
    }

    // Calendar navigations
    const prevMonth = document.getElementById('prev-month-btn');
    const nextMonth = document.getElementById('next-month-btn');
    if (prevMonth) prevMonth.addEventListener('click', () => this.changeMonth(-1));
    if (nextMonth) nextMonth.addEventListener('click', () => this.changeMonth(1));
  },

  saveCheckin() {
    const mood = parseInt(document.getElementById('checkin-mood').value);
    const energy = parseInt(document.getElementById('checkin-energy').value);
    const gratitude = document.getElementById('checkin-gratitude').value;
    const focus = document.getElementById('checkin-focus').value;
    
    const dateStr = this.loggingDate || getTodayString();
    
    // Save to state
    BloomState.dailyLogs[dateStr] = { mood, energy, gratitude, focus };
    
    // Complete "Log mood & energy" habit automatically if logged for today
    if (dateStr === getTodayString()) {
      const habit = BloomState.habits.find(h => h.id === 'h3');
      if (habit && !habit.checkedDates.includes(dateStr)) {
        habit.checkedDates.push(dateStr);
        HabitModule.calculateStreaks(habit);
      }
    }

    BloomState.save();
    this.loggingDate = null;
    
    document.getElementById('checkin-modal').classList.remove('active');
    showNotification("🌸 Wellness log saved successfully!");

    // Update views
    DashboardModule.render();
    this.renderCalendar();
  },

  changeMonth(direction) {
    this.currentDate.setMonth(this.currentDate.getMonth() + direction);
    this.renderCalendar();
  },

  renderCalendar() {
    const calendarGrid = document.getElementById('calendar-grid');
    const monthYearLabel = document.getElementById('calendar-month-year');
    if (!calendarGrid || !monthYearLabel) return;

    calendarGrid.innerHTML = '';
    
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    monthYearLabel.innerText = `${monthNames[month]} ${year}`;

    // First day of the month
    const firstDay = new Date(year, month, 1).getDay();
    // Days in current month
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    // Days in previous month
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    // 1. Previous month days padding
    for (let i = firstDay - 1; i >= 0; i--) {
      const cell = document.createElement('div');
      cell.className = 'calendar-day-cell other-month';
      cell.innerHTML = `<span class="calendar-day-num">${daysInPrevMonth - i}</span>`;
      calendarGrid.appendChild(cell);
    }

    // 2. Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const cell = document.createElement('div');
      cell.className = 'calendar-day-cell';
      
      const dayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const hasLog = BloomState.dailyLogs[dayStr];
      const isToday = dayStr === getTodayString();
      const reminders = BloomState.reminders[dayStr] || [];
      
      if (isToday) cell.classList.add('today');

      let indicators = '';
      
      // Mood indicator dot
      if (hasLog) {
        const mood = hasLog.mood;
        let moodColor = 'rgba(122, 184, 147, 0.85)'; // Sage
        if (mood <= 4) moodColor = '#e57373'; // Low mood red
        else if (mood <= 7) moodColor = '#ffb74d'; // Mid mood amber
        indicators += `<span class="indicator-mood-dot" style="background: ${moodColor}; box-shadow: 0 0 6px ${moodColor}"></span>`;
      }
      
      // Habits completed overlay dots
      const habitsCompleted = BloomState.habits.filter(h => h.checkedDates.includes(dayStr)).length;
      if (habitsCompleted > 0) {
        for (let k = 0; k < Math.min(habitsCompleted, 3); k++) {
          indicators += `<span style="width: 4px; height: 4px; background: var(--accent-color); border-radius: 50%; display: inline-block; margin-left: 2px;"></span>`;
        }
      }

      // Reminders bell indicator
      if (reminders.length > 0) {
        indicators += `<span style="font-size: 0.65rem; margin-left: 2px;" title="${reminders.length} event reminders">🔔</span>`;
      }
      
      cell.innerHTML = `
        <span class="calendar-day-num">${day}</span>
        <div class="day-indicators" style="display: flex; align-items: center; gap: 2px;">
          ${indicators}
        </div>
      `;

      cell.addEventListener('click', () => {
        this.showDayDetails(dayStr);
      });

      calendarGrid.appendChild(cell);
    }

    // Auto load selected date details
    if (!BloomState.selectedDate) {
      this.showDayDetails(getTodayString());
    } else {
      this.showDayDetails(BloomState.selectedDate);
    }
  },

  showDayDetails(dateStr) {
    BloomState.selectedDate = dateStr;
    const log = BloomState.dailyLogs[dateStr];
    const detailsPanel = document.getElementById('calendar-day-details');
    if (!detailsPanel) return;

    const readable = formatReadableDate(dateStr);
    const dayReminders = BloomState.reminders[dateStr] || [];

    // Base template
    let html = `
      <div class="detail-block">
        <div class="detail-label">LOGGED DATE</div>
        <div class="detail-value font-semibold">${readable}</div>
      </div>
    `;

    // 1. Wellness Log
    if (log) {
      html += `
        <div class="detail-block">
          <div class="detail-label">MOOD RATING</div>
          <div class="detail-value font-outfit" style="font-size: 1.35rem; font-weight: 700; color: var(--accent-color)">${log.mood} / 10</div>
        </div>
        <div class="detail-block">
          <div class="detail-label">PHYSICAL ENERGY</div>
          <div class="detail-value font-outfit" style="font-size: 1.35rem; font-weight: 700; color: var(--accent-color)">${log.energy} / 10</div>
        </div>
        <div class="detail-block">
          <div class="detail-label">GRATITUDE ENTRY</div>
          <div class="detail-value italic text-sm">"${log.gratitude}"</div>
        </div>
        <div class="detail-block">
          <div class="detail-label">PRIMARY GOAL</div>
          <div class="detail-value text-sm">${log.focus}</div>
        </div>
      `;
    } else {
      html += `
        <p class="opacity-60 text-sm mb-3">No wellness log recorded for this date.</p>
        <button id="cal-checkin-trigger" class="btn btn-primary btn-sm mb-4">
          Add Log for ${readable}
        </button>
      `;
    }

    // 2. Reminders & Schedule
    let remindersHTML = '';
    if (dayReminders.length === 0) {
      remindersHTML = '<p class="opacity-60 text-xs italic">No event reminders set for this day.</p>';
    } else {
      remindersHTML = `<ul class="space-y-2 mt-2" style="list-style: none;">`;
      dayReminders.forEach((rem, idx) => {
        remindersHTML += `
          <li class="flex-between text-sm" style="background: rgba(255,255,255,0.02); padding: 0.4rem 0.6rem; border-radius: var(--radius-sm); border: 1px solid var(--card-border);">
            <span>📅 ${rem}</span>
            <button class="link-btn btn-xs delete-reminder-btn" data-idx="${idx}" style="color: #e57373">Delete</button>
          </li>
        `;
      });
      remindersHTML += `</ul>`;
    }

    html += `
      <div class="detail-block mt-4" style="border-top: 1px solid rgba(255,255,255,0.06); padding-top: 1rem;">
        <div class="detail-label">Event Reminders & Routines</div>
        ${remindersHTML}
        
        <div class="flex-between mt-3" style="gap: 8px;">
          <input type="text" id="new-reminder-input" class="input-field" placeholder="Add reminder (e.g. 3pm Walk)" style="padding: 0.4rem 0.8rem; font-size: 0.8rem;">
          <button id="add-reminder-btn" class="btn btn-secondary btn-sm" style="padding: 0.4rem 0.80rem;">Add</button>
        </div>
      </div>
    `;

    detailsPanel.innerHTML = html;

    // Hook events
    const calCheckin = document.getElementById('cal-checkin-trigger');
    if (calCheckin) {
      calCheckin.addEventListener('click', () => {
        this.loggingDate = dateStr;
        document.getElementById('checkin-gratitude').value = '';
        document.getElementById('checkin-focus').value = '';
        document.getElementById('checkin-modal').classList.add('active');
      });
    }

    const addRemBtn = document.getElementById('add-reminder-btn');
    if (addRemBtn) {
      addRemBtn.addEventListener('click', () => {
        const inp = document.getElementById('new-reminder-input');
        const text = inp.value.trim();
        if (text) {
          if (!BloomState.reminders[dateStr]) {
            BloomState.reminders[dateStr] = [];
          }
          BloomState.reminders[dateStr].push(text);
          BloomState.save();
          showNotification("🔔 Event reminder scheduled!");
          this.renderCalendar();
        }
      });
    }

    document.querySelectorAll('.delete-reminder-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-idx'));
        if (BloomState.reminders[dateStr]) {
          BloomState.reminders[dateStr].splice(idx, 1);
          if (BloomState.reminders[dateStr].length === 0) {
            delete BloomState.reminders[dateStr];
          }
          BloomState.save();
          showNotification("🗑️ Reminder deleted.");
          this.renderCalendar();
        }
      });
    });
  }
};;

// ==========================================
// 5. HABITS MANAGEMENT MODULE
// ==========================================
const HabitModule = {
  activeRoutines: {}, // Track setInterval IDs
  routineIntervalsDemo: {
    water: 20 * 1000,   // 20s demo
    stretch: 35 * 1000, // 35s demo
    eyes: 15 * 1000     // 15s demo
  },

  init() {
    const form = document.getElementById('habit-form');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.addHabit();
      });
    }

    // Set up Self-Care Routine toggles
    document.querySelectorAll('.routine-toggle').forEach(btn => {
      const routine = btn.getAttribute('data-routine');
      btn.addEventListener('click', () => this.toggleRoutine(routine, btn));
    });
  },

  toggleRoutine(routine, btn) {
    if (this.activeRoutines[routine]) {
      // Disable
      clearInterval(this.activeRoutines[routine]);
      delete this.activeRoutines[routine];
      btn.innerText = 'Enable';
      btn.className = 'btn btn-xs btn-outline routine-toggle';
      showNotification(`🌿 Disabled self-care routine reminder.`);
    } else {
      // Enable
      if (window.Notification) {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            this.startRoutineInterval(routine, btn);
          } else {
            showNotification("⚠️ Notifications blocked. Falling back to in-app alerts.");
            this.startRoutineInterval(routine, btn);
          }
        });
      } else {
        this.startRoutineInterval(routine, btn);
      }
    }
  },

  startRoutineInterval(routine, btn) {
    btn.innerText = 'Disable';
    btn.className = 'btn btn-xs btn-primary routine-toggle';
    
    const messages = {
      water: "💧 Hydration Check: Take a moment to drink a glass of water!",
      stretch: "🧘 Movement Check: Stand up, stretch your back, and relax your shoulders.",
      eyes: "👁️ Eye Care Check: Look at something 20 feet away for 20 seconds (20-20-20 rule)."
    };
    const title = {
      water: "Bloom Hydration Reminder",
      stretch: "Bloom Stretch Reminder",
      eyes: "Bloom Eye Care Reminder"
    };

    // Trigger instant demo notification
    this.sendNotification(title[routine], messages[routine]);

    const demoMs = this.routineIntervalsDemo[routine] || 20000;
    this.activeRoutines[routine] = setInterval(() => {
      this.sendNotification(title[routine], messages[routine]);
      MonetizationSimulator.trackImpression();
    }, demoMs);

    showNotification(`Routine active (triggers every ${demoMs / 1000}s for demo)`);
  },

  sendNotification(title, text) {
    if (window.Notification && Notification.permission === 'granted') {
      try {
        new Notification(title, { body: text });
      } catch (e) {
        showNotification(text);
      }
    } else {
      showNotification(text);
    }
    this.playNotificationSound();
  },

  playNotificationSound() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(659.25, now); // E5
      osc.frequency.setValueAtTime(880.00, now + 0.1); // A5
      
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.2, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(now + 0.45);
    } catch(e) {}
  },

  addHabit() {
    const nameInput = document.getElementById('habit-name');
    const categorySelect = document.getElementById('habit-category');
    if (!nameInput || !categorySelect) return;

    const name = nameInput.value.trim();
    const category = categorySelect.value;
    const id = 'h_' + Date.now();

    const newHabit = {
      id,
      name,
      category,
      checkedDates: [],
      streak: 0
    };

    BloomState.habits.push(newHabit);
    BloomState.save();

    nameInput.value = '';
    showNotification(`💪 Habit "${name}" added!`);

    this.render();
    DashboardModule.render();
  },

  toggleHabit(habitId, dateStr) {
    const habit = BloomState.habits.find(h => h.id === habitId);
    if (!habit) return;

    const idx = habit.checkedDates.indexOf(dateStr);
    if (idx > -1) {
      // Uncheck
      habit.checkedDates.splice(idx, 1);
    } else {
      // Check
      habit.checkedDates.push(dateStr);
    }

    this.calculateStreaks(habit);
    BloomState.save();
    
    // Play a gentle check tone on check
    if (idx === -1) {
      this.playCheckTone();
      // Incremet ad impression
      MonetizationSimulator.trackImpression();
    }

    this.render();
    DashboardModule.render();
  },

  calculateStreaks(habit) {
    let streak = 0;
    const checked = [...habit.checkedDates].sort();
    if (checked.length === 0) {
      habit.streak = 0;
      return;
    }

    // Sort in ascending date order
    const dateObjects = checked.map(d => new Date(d));
    let today = new Date();
    today.setHours(0,0,0,0);

    let checkDay = new Date(today);
    // If today is checked, start counting from today. Else check yesterday.
    const todayStr = getTodayString();
    const hasToday = checked.includes(todayStr);

    let lastCheckedIndex = checked.length - 1;
    let expectedDate = hasToday ? today : new Date(today.setDate(today.getDate() - 1));
    expectedDate.setHours(0,0,0,0);

    // Track backwards
    let tempDate = new Date(expectedDate);
    for (let i = lastCheckedIndex; i >= 0; i--) {
      const itemDateStr = checked[i];
      const itemDate = new Date(itemDateStr);
      itemDate.setHours(0,0,0,0);

      // Check if dates are continuous
      const diffTime = Math.abs(tempDate - itemDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 0) {
        streak++;
        tempDate.setDate(tempDate.getDate() - 1);
      } else if (diffDays === 1) {
        streak++;
        tempDate = new Date(itemDate);
        tempDate.setDate(tempDate.getDate() - 1);
      } else {
        break; // Streak broken
      }
    }

    habit.streak = streak;
  },

  playCheckTone() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.setValueAtTime(880.00, now + 0.08); // A5
      
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.25, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(now + 0.35);
    } catch (e) {}
  },

  render() {
    const listContainer = document.getElementById('habits-list-container');
    if (!listContainer) return;

    listContainer.innerHTML = '';
    const todayStr = getTodayString();

    if (BloomState.habits.length === 0) {
      listContainer.innerHTML = '<p class="opacity-60 text-sm">No habits logged. Define custom habits in the sidebar panel.</p>';
      return;
    }

    BloomState.habits.forEach(habit => {
      const isChecked = habit.checkedDates.includes(todayStr);
      const row = document.createElement('div');
      row.className = 'habit-row-item';

      row.innerHTML = `
        <div class="habit-left">
          <div class="custom-checkbox ${isChecked ? 'checked' : ''}" data-id="${habit.id}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <span class="habit-title font-outfit ${isChecked ? 'checked' : ''}">${habit.name}</span>
        </div>
        <div class="habit-right">
          <div class="streak-counter-box">
            <span class="streak-fire">🔥</span>
            <span>${habit.streak} days</span>
          </div>
          <button class="btn-icon btn-xs delete-habit-btn" data-id="${habit.id}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 14px; height: 14px"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </button>
        </div>
      `;

      // Check event
      row.querySelector('.custom-checkbox').addEventListener('click', () => {
        this.toggleHabit(habit.id, todayStr);
      });

      // Delete event
      row.querySelector('.delete-habit-btn').addEventListener('click', () => {
        this.deleteHabit(habit.id);
      });

      listContainer.appendChild(row);
    });
  },

  deleteHabit(id) {
    BloomState.habits = BloomState.habits.filter(h => h.id !== id);
    BloomState.save();
    this.render();
    DashboardModule.render();
  }
};

// ==========================================
// 6. MINDFUL JOURNAL MODULE
// ==========================================
const JournalModule = {
  prompts: [
    "What is one thing you can let go of today to reduce your stress?",
    "Describe a boundary you successfully set or need to set this week.",
    "What is something you really appreciate about your personality?",
    "Write about a difficulty you overcame recently. What did it teach you?",
    "What aspect of your physical health are you most grateful for today?",
    "List three micro-moments that brought a smile to your face today."
  ],

  init() {
    const newPromptBtn = document.getElementById('new-prompt-btn');
    if (newPromptBtn) {
      newPromptBtn.addEventListener('click', () => this.rotatePrompt());
    }

    const form = document.getElementById('journal-form');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.saveEntry();
      });
    }

    // Set initial prompt on load
    this.rotatePrompt();
  },

  rotatePrompt() {
    const promptText = document.getElementById('journal-prompt-text');
    if (!promptText) return;

    let current = promptText.innerText;
    let next = current;
    while (next === current) {
      const idx = Math.floor(Math.random() * this.prompts.length);
      next = this.prompts[idx];
    }
    promptText.innerText = next;
  },

  saveEntry() {
    const prompt = document.getElementById('journal-prompt-text').innerText;
    const entry = document.getElementById('journal-entry').value.trim();
    if (!entry) return;

    const dateStr = getTodayString();
    const id = 'j_' + Date.now();

    const newLog = { id, date: dateStr, prompt, entry };
    BloomState.journalEntries.unshift(newLog); // Prepend so newest is top
    BloomState.save();

    // Clear textarea
    document.getElementById('journal-entry').value = '';
    showNotification("✍️ Journal entry saved. Reflection complete.");

    // Auto reward simulated ad impression
    MonetizationSimulator.trackImpression();

    this.render();
  },

  render() {
    const container = document.getElementById('journal-logs-container');
    if (!container) return;

    container.innerHTML = '';

    if (BloomState.journalEntries.length === 0) {
      container.innerHTML = '<p class="opacity-60 text-sm">Your journaling logs will appear here.</p>';
      return;
    }

    BloomState.journalEntries.forEach(log => {
      const card = document.createElement('div');
      card.className = 'journal-log-card';
      
      const readable = formatReadableDate(log.date);

      card.innerHTML = `
        <div class="flex-between">
          <span class="log-date font-semibold">${readable}</span>
          <button class="link-btn btn-xs delete-journal-btn" data-id="${log.id}">Delete</button>
        </div>
        <div class="prompt-label text-xs mt-1" style="font-style: italic;">Prompt: ${log.prompt}</div>
        <p class="log-snippet opacity-85">${log.entry}</p>
      `;

      // Click card to view full details
      card.addEventListener('click', (e) => {
        // Prevent click if trigger delete
        if (e.target.classList.contains('delete-journal-btn')) return;
        this.showFullLogModal(log);
      });

      card.querySelector('.delete-journal-btn').addEventListener('click', () => {
        this.deleteLog(log.id);
      });

      container.appendChild(card);
    });
  },

  deleteLog(id) {
    BloomState.journalEntries = BloomState.journalEntries.filter(j => j.id !== id);
    BloomState.save();
    this.render();
  },

  showFullLogModal(log) {
    // Generate temporary view overlay
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay active';
    
    overlay.innerHTML = `
      <div class="modal-container glass-card" style="max-width: 500px">
        <div class="modal-header">
          <h2 class="font-outfit text-lg font-bold">Journal Entry</h2>
          <button class="btn-icon close-temp-modal">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 20px; height: 20px"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
        <div class="mt-4 space-y-3">
          <div class="text-xs opacity-60 font-semibold">${formatReadableDate(log.date)}</div>
          <div class="prompt-box text-sm mb-2" style="background: rgba(var(--accent-color-rgb), 0.05); padding: 0.5rem; border-left: 2px solid var(--accent-color)">
            <strong>Prompt:</strong> ${log.prompt}
          </div>
          <p class="text-sm opacity-90" style="white-space: pre-wrap; line-height: 1.6">${log.entry}</p>
        </div>
      </div>
    `;

    overlay.querySelector('.close-temp-modal').addEventListener('click', () => {
      overlay.remove();
    });

    document.body.appendChild(overlay);
  }
};

// ==========================================
// 7. PASSIVE INCOME STORE & AFFILIATE MODULE
// ==========================================
const StoreModule = {
  affiliates: [
    { id: 'aff1', title: 'Sleek Dotted Bullet Journal', desc: 'Premium thick paper dotted notebook, perfect for mindful daily reflections.', price: 16.99, icon: '📔', commissionRate: 0.10 },
    { id: 'aff2', title: 'Ergonomic Organic Meditation Cushion', desc: 'Filled with organic buckwheat hulls, aligns spine for deep seated focus sessions.', price: 39.99, icon: '🧘', commissionRate: 0.08 },
    { id: 'aff3', title: 'Lumiere Sunset Ambiance Lamp', desc: 'Simulates circadian colors to naturally boost energy mornings & relax nights.', price: 29.99, icon: '🌅', commissionRate: 0.08 },
    { id: 'aff4', title: 'The Wellness Compass Book', desc: 'Award-winning guided workbook with 52 weeks of structured lifestyle habits.', price: 14.50, icon: '📘', commissionRate: 0.12 }
  ],

  digitals: [
    { id: 'dig1', title: 'Annual Wellness Organizing PDF Planner', desc: '12-month printable grid templates, weekly sheets, and mood calendar charts.', price: 2.99, icon: '🖨️' },
    { id: 'dig2', title: '30-Day Mindfulness Guide Course', desc: 'E-book with custom guided worksheets, prompt trackers, and audio script exercises.', price: 4.99, icon: '🎓' },
    { id: 'dig3', title: 'Circadian Alarm Audio Ringtone Pack', desc: 'High-quality atmospheric audio tones to awaken gently instead of loud phone buzzes.', price: 1.99, icon: '🎵' }
  ],

  init() {
    // Tip jar options
    document.querySelectorAll('.tip-option').forEach(btn => {
      btn.addEventListener('click', () => {
        const amt = parseFloat(btn.getAttribute('data-tip'));
        this.addTip(amt);
      });
    });

    const tipOpen = document.getElementById('open-tipjar-btn');
    const tipClose = document.getElementById('tipjar-modal-close');
    const tipModal = document.getElementById('tipjar-modal');

    if (tipOpen) {
      tipOpen.addEventListener('click', () => {
        tipModal.classList.add('active');
      });
    }
    if (tipClose) {
      tipClose.addEventListener('click', () => {
        tipModal.classList.remove('active');
      });
    }
  },

  addTip(amount) {
    BloomState.earnings.tips += amount;
    BloomState.save();
    
    document.getElementById('tipjar-modal').classList.remove('active');
    showNotification(`💖 Tip of $${amount.toFixed(2)} simulated! Thank you for supporting free app creators.`);
    
    this.playPurchaseChime();
    AnalyticsModule.render();
  },

  buyAffiliate(id) {
    const item = this.affiliates.find(a => a.id === id);
    if (!item) return;

    const commission = item.price * item.commissionRate;
    BloomState.earnings.affiliates += commission;
    BloomState.save();

    showNotification(`📦 Simulated Affiliate Sale: Earned $${commission.toFixed(2)} commission! (10% of $${item.price})`);
    
    this.playPurchaseChime();
    AnalyticsModule.render();
  },

  buyDigital(id) {
    const item = this.digitals.find(d => d.id === id);
    if (!item) return;

    BloomState.earnings.digital += item.price;
    BloomState.save();

    showNotification(`✨ Simulated Store Sale: Earned $${item.price.toFixed(2)} on digital product purchase.`);
    
    this.playPurchaseChime();
    AnalyticsModule.render();
  },

  playPurchaseChime() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.setValueAtTime(659.25, now + 0.08); // E5
      osc.frequency.setValueAtTime(783.99, now + 0.16); // G5
      osc.frequency.setValueAtTime(1046.50, now + 0.24); // C6
      
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.2, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(now + 0.5);
    } catch(e) {}
  },

  render() {
    // Render Affiliate List
    const affContainer = document.getElementById('affiliate-list');
    if (affContainer) {
      affContainer.innerHTML = '';
      this.affiliates.forEach(item => {
        const card = document.createElement('div');
        card.className = 'store-item-card';
        card.innerHTML = `
          <div class="store-item-img">${item.icon}</div>
          <div class="store-item-details">
            <h4 class="store-item-title font-outfit">${item.title}</h4>
            <p class="store-item-desc">${item.desc}</p>
            <div class="store-item-price">$${item.price.toFixed(2)}</div>
          </div>
          <button class="btn btn-primary btn-sm buy-aff-btn" data-id="${item.id}">Buy on Amazon</button>
        `;
        card.querySelector('.buy-aff-btn').addEventListener('click', () => this.buyAffiliate(item.id));
        affContainer.appendChild(card);
      });
    }

    // Render Digital Downloads List
    const digContainer = document.getElementById('digital-list');
    if (digContainer) {
      digContainer.innerHTML = '';
      this.digitals.forEach(item => {
        const card = document.createElement('div');
        card.className = 'store-item-card';
        card.innerHTML = `
          <div class="store-item-img">${item.icon}</div>
          <div class="store-item-details">
            <h4 class="store-item-title font-outfit">${item.title}</h4>
            <p class="store-item-desc">${item.desc}</p>
            <div class="store-item-price">$${item.price.toFixed(2)}</div>
          </div>
          <button class="btn btn-secondary btn-sm buy-dig-btn" data-id="${item.id}">Get Printable</button>
        `;
        card.querySelector('.buy-dig-btn').addEventListener('click', () => this.buyDigital(item.id));
        digContainer.appendChild(card);
      });
    }
  }
};

// ==========================================
// 8. CREATOR ANALYTICS MODULE
// ==========================================
const AnalyticsModule = {
  chartCanvas: null,
  ctx: null,

  init() {
    this.chartCanvas = document.getElementById('earnings-chart');
    if (this.chartCanvas) {
      this.ctx = this.chartCanvas.getContext('2d');
    }
  },

  render() {
    // 1. Update metric texts
    const downloads = document.getElementById('stats-downloads');
    const dau = document.getElementById('stats-dau');
    const impressions = document.getElementById('stats-impressions');
    const totalEarnings = document.getElementById('stats-earnings');
    
    if (downloads) downloads.innerText = BloomState.trafficStats.downloads.toLocaleString();
    if (dau) dau.innerText = BloomState.trafficStats.activeUsers.toLocaleString();
    if (impressions) impressions.innerText = BloomState.trafficStats.impressions.toLocaleString();
    
    const sum = BloomState.earnings.ads + BloomState.earnings.affiliates + BloomState.earnings.digital + BloomState.earnings.tips;
    if (totalEarnings) totalEarnings.innerText = `$${sum.toFixed(2)}`;

    // Breakdown details
    const bdAds = document.getElementById('breakdown-ads');
    const bdAff = document.getElementById('breakdown-affiliates');
    const bdDig = document.getElementById('breakdown-digital');
    const bdTips = document.getElementById('breakdown-tips');

    if (bdAds) bdAds.innerText = `$${BloomState.earnings.ads.toFixed(2)}`;
    if (bdAff) bdAff.innerText = `$${BloomState.earnings.affiliates.toFixed(2)}`;
    if (bdDig) bdDig.innerText = `$${BloomState.earnings.digital.toFixed(2)}`;
    if (bdTips) bdTips.innerText = `$${BloomState.earnings.tips.toFixed(2)}`;

    // 2. Render HTML5 canvas chart
    this.renderChart();
  },

  renderChart() {
    if (!this.ctx || !this.chartCanvas) return;
    
    // Clear canvas
    const width = this.chartCanvas.width = this.chartCanvas.parentElement.clientWidth - 32;
    const height = this.chartCanvas.height = 200;
    
    const ctx = this.ctx;
    ctx.clearRect(0, 0, width, height);

    // Dynamic data: Month-over-month simulated earnings trajectory
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun (Proj)'];
    
    // Growth curve values based on user active earnings
    const currentSum = BloomState.earnings.ads + BloomState.earnings.affiliates + BloomState.earnings.digital + BloomState.earnings.tips;
    const data = [12.40, 24.50, 48.90, 95.20, 160.00, 240.00 + currentSum];

    const padding = 40;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    // Find max value
    const maxVal = Math.max(...data) * 1.25;

    // Set styling based on current CSS accent color
    const accentColor = getComputedStyle(document.body).getPropertyValue('--accent-color').trim() || '#7ab893';

    // 1. Draw Grid Lines & Labels
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = '10px Inter, sans-serif';
    ctx.textAlign = 'right';

    const gridLines = 4;
    for (let i = 0; i <= gridLines; i++) {
      const y = padding + (chartHeight / gridLines) * i;
      const val = maxVal - (maxVal / gridLines) * i;
      
      // Line
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();

      // Label
      ctx.fillText(`$${val.toFixed(0)}`, padding - 8, y + 3);
    }

    // 2. Draw Month labels below
    ctx.textAlign = 'center';
    const xStep = chartWidth / (months.length - 1);
    for (let i = 0; i < months.length; i++) {
      const x = padding + xStep * i;
      ctx.fillText(months[i], x, height - padding + 15);
    }

    // 3. Draw gradient line curve
    ctx.beginPath();
    const points = [];
    for (let i = 0; i < data.length; i++) {
      const x = padding + xStep * i;
      const y = height - padding - (data[i] / maxVal) * chartHeight;
      points.push({ x, y });
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        // Curve control points
        const prev = points[i - 1];
        const cpX1 = prev.x + (x - prev.x) / 2;
        const cpY1 = prev.y;
        const cpX2 = prev.x + (x - prev.x) / 2;
        const cpY2 = y;
        ctx.bezierCurveTo(cpX1, cpY1, cpX2, cpY2, x, y);
      }
    }
    
    // Stroke the line
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 3.5;
    ctx.shadowColor = accentColor;
    ctx.shadowBlur = 10;
    ctx.stroke();
    
    // Turn off shadow for fill
    ctx.shadowBlur = 0;

    // Fill under path
    ctx.lineTo(points[points.length - 1].x, height - padding);
    ctx.lineTo(points[0].x, height - padding);
    ctx.closePath();
    
    const fillGrad = ctx.createLinearGradient(0, padding, 0, height - padding);
    fillGrad.addColorStop(0, `rgba(${hexToRgb(accentColor)}, 0.18)`);
    fillGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = fillGrad;
    ctx.fill();

    // 4. Draw node dots
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 2.5;
    for (let i = 0; i < points.length; i++) {
      ctx.beginPath();
      ctx.arc(points[i].x, points[i].y, 4, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();
    }
  }
};

// Helper: Hex color to RGB
function hexToRgb(hex) {
  // Simple check for standard short hex
  hex = hex.replace('#', '');
  if (hex.length === 3) {
    hex = hex.split('').map(c => c + c).join('');
  }
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return `${r}, ${g}, ${b}`;
}

// ==========================================
// 9. DYNAMIC MONETIZATION SIMULATOR & AD BLOCK
// ==========================================
const MonetizationSimulator = {
  adsList: [
    { title: 'Soothe Meditation App', text: '10-day audio courses for peace, clarity & deeper focus cycles. Open App Store.', urlBtn: 'Install Now', cpc: 0.45 },
    { title: 'PureVeg Organic Matcha', desc: 'Soothe anxiety and crash-free focus with direct farm organic green teas.', urlBtn: 'Shop Matcha', cpc: 0.65 },
    { title: 'Daily Gratitude Hardcover', desc: 'Beautiful leather-bound structured journal on sale. 15% off.', urlBtn: 'Buy on Amazon', cpc: 0.35 },
    { title: 'FlowState Focus Timer Pro', desc: 'Sync your pomodoro timer across devices. Free download trial.', urlBtn: 'Try Premium', cpc: 0.50 }
  ],
  currentAdIndex: 0,

  init() {
    // Simulated traffic engine toggle
    const toggleBtn = document.getElementById('traffic-engine-toggle');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => this.toggleTrafficSimulation());
    }

    // Ad clicks
    const adActionBtn = document.getElementById('simulated-ad-action-btn');
    const adBanner = document.querySelector('.admob-sim-banner');
    if (adActionBtn) {
      adActionBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // Avoid double click triggers
        this.clickAd();
      });
    }
    if (adBanner) {
      adBanner.addEventListener('click', () => this.clickAd());
    }

    // Auto rotate ads every 18 seconds
    setInterval(() => this.rotateAd(), 18000);
    this.rotateAd();
  },

  rotateAd() {
    this.currentAdIndex = (this.currentAdIndex + 1) % this.adsList.length;
    const ad = this.adsList[this.currentAdIndex];

    const titleEl = document.getElementById('simulated-ad-title');
    const textEl = document.getElementById('simulated-ad-text');
    const btnEl = document.getElementById('simulated-ad-action-btn');

    if (titleEl && textEl && btnEl) {
      titleEl.innerText = ad.title;
      textEl.innerText = ad.desc || ad.text;
      btnEl.innerText = ad.urlBtn;
    }
  },

  trackImpression() {
    BloomState.trafficStats.impressions++;
    
    // Earn small fraction from showing ads (Simulating CPM of $2.50)
    // Formula: (CPM / 1000) per impression
    const cpmEarnings = 2.50 / 1000;
    BloomState.earnings.ads += cpmEarnings;
    
    BloomState.save();
    
    // Update active analytics view if active
    if (document.getElementById('view-analytics').classList.contains('active')) {
      AnalyticsModule.render();
    }
  },

  clickAd() {
    const ad = this.adsList[this.currentAdIndex];
    const clickPayout = ad.cpc;

    BloomState.earnings.ads += clickPayout;
    BloomState.save();

    showNotification(`💸 Click Simulated! Google AdMob payout: +$${clickPayout.toFixed(2)} CPC.`);
    
    // Rotate to next ad immediately
    this.rotateAd();
    
    // Render
    AnalyticsModule.render();
  },

  toggleTrafficSimulation() {
    const toggleBtn = document.getElementById('traffic-engine-toggle');
    const statusLight = document.getElementById('sidebar-traffic-status');
    
    if (BloomState.simulationActive) {
      // Deactivate
      BloomState.simulationActive = false;
      clearInterval(BloomState.simulationInterval);
      if (toggleBtn) {
        toggleBtn.innerText = 'Start Simulation';
        toggleBtn.className = 'btn btn-outline btn-sm';
      }
      if (statusLight) statusLight.innerText = 'Traffic: Stopped';
      document.querySelector('.pulse-dot').style.background = '#f44336';
      document.querySelector('.pulse-dot').style.boxShadow = '0 0 8px #f44336';
    } else {
      // Activate
      BloomState.simulationActive = true;
      if (toggleBtn) {
        toggleBtn.innerText = 'Stop Simulation';
        toggleBtn.className = 'btn btn-primary btn-sm';
      }
      if (statusLight) statusLight.innerText = 'Traffic: Live Active';
      document.querySelector('.pulse-dot').style.background = '#4caf50';
      document.querySelector('.pulse-dot').style.boxShadow = '0 0 8px #4caf50';

      // Simulation ticks every 2 seconds
      BloomState.simulationInterval = setInterval(() => {
        // Random increases in traffic downloads
        const newDls = Math.floor(Math.random() * 3) + 1; // 1 to 3 downloads
        BloomState.trafficStats.downloads += newDls;
        
        // Dynamic DAU fluctuations
        const shift = Math.floor(Math.random() * 9) - 4; // -4 to +4 DAUs
        BloomState.trafficStats.activeUsers = Math.max(10, BloomState.trafficStats.activeUsers + shift);

        // Every active user simulates viewing 1.5 ads on average
        const newImpressions = Math.floor(BloomState.trafficStats.activeUsers * 0.05);
        for(let i = 0; i < newImpressions; i++) {
          this.trackImpression();
        }

        // Random chance of simulated passive clicks or purchases!
        // 0.8% chance of simulated organic affiliate buy
        if (Math.random() < 0.008) {
          const item = StoreModule.affiliates[Math.floor(Math.random() * StoreModule.affiliates.length)];
          const commission = item.price * item.commissionRate;
          BloomState.earnings.affiliates += commission;
          showNotification(`🚀 Organic User Purchase! Simulated affiliate commission: +$${commission.toFixed(2)}`);
          StoreModule.playPurchaseChime();
        }

        // 0.4% chance of simulated organic digital store download
        if (Math.random() < 0.004) {
          const item = StoreModule.digitals[Math.floor(Math.random() * StoreModule.digitals.length)];
          BloomState.earnings.digital += item.price;
          showNotification(`🚀 Organic Store Download! PDF sale: +$${item.price.toFixed(2)}`);
          StoreModule.playPurchaseChime();
        }

        BloomState.save();
        
        // Re-render
        if (document.getElementById('view-analytics').classList.contains('active')) {
          AnalyticsModule.render();
        }
      }, 2500);
    }
  }
};

// ==========================================
// 10. DASHBOARD COMP coordinator
// ==========================================
const DashboardModule = {
  render() {
    const todayStr = getTodayString();
    const log = BloomState.dailyLogs[todayStr];
    
    // Render Checkin panel
    const moodPanel = document.getElementById('dash-mood-summary');
    if (moodPanel) {
      if (log) {
        moodPanel.innerHTML = `
          <div class="stat-row">
            <span>Mood Rating:</span>
            <span class="font-bold text-accent">${log.mood} / 10</span>
          </div>
          <div class="stat-bar-container"><div class="stat-bar-fill" style="width: ${log.mood * 10}%"></div></div>
          
          <div class="stat-row mt-2">
            <span>Energy Rating:</span>
            <span class="font-bold text-accent">${log.energy} / 10</span>
          </div>
          <div class="stat-bar-container"><div class="stat-bar-fill" style="width: ${log.energy * 10}%"></div></div>

          <div class="detail-block mt-2" style="border-bottom:none; padding-bottom:0">
            <div class="detail-label">Today's Focus:</div>
            <div class="detail-value opacity-90 font-medium">"${log.focus}"</div>
          </div>
        `;
      } else {
        moodPanel.innerHTML = `
          <div class="empty-state-checkin">
            <p class="text-sm opacity-60 mb-2">No data logged for today.</p>
            <button id="dash-checkin-trigger" class="link-btn">Log daily wellness now</button>
          </div>
        `;
        const dashCheck = document.getElementById('dash-checkin-trigger');
        if (dashCheck) {
          dashCheck.addEventListener('click', () => {
            document.getElementById('checkin-modal').classList.add('active');
          });
        }
      }
    }

    // Render Compact Habit checklist
    const compactHabitList = document.getElementById('dash-habits-list');
    if (compactHabitList) {
      compactHabitList.innerHTML = '';
      if (BloomState.habits.length === 0) {
        compactHabitList.innerHTML = '<p class="text-sm opacity-60">No habits defined. Go to Habit Tracker to add.</p>';
      } else {
        // Render top 3 habits
        BloomState.habits.slice(0, 3).forEach(habit => {
          const isChecked = habit.checkedDates.includes(todayStr);
          const item = document.createElement('div');
          item.className = 'habit-compact-item';
          item.innerHTML = `
            <span class="text-sm font-medium ${isChecked ? 'opacity-50 checked-line' : ''}" style="${isChecked ? 'text-decoration: line-through;' : ''}">${habit.name}</span>
            <div class="custom-checkbox ${isChecked ? 'checked' : ''}" data-id="${habit.id}" style="width: 18px; height: 18px">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" style="width: 12px; height: 12px;"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
          `;
          item.querySelector('.custom-checkbox').addEventListener('click', () => {
            HabitModule.toggleHabit(habit.id, todayStr);
          });
          compactHabitList.appendChild(item);
        });
      }
    }
  }
};

// ==========================================
// 11. GENERAL APP INITIALIZER & THEMES
// ==========================================
function initGeneralApp() {
  // Theme Switching
  const select = document.getElementById('theme-select');
  if (select) {
    // Sync dropdown with current theme
    select.value = BloomState.theme;
    
    select.addEventListener('change', (e) => {
      const activeTheme = e.target.value;
      
      // Update body classes
      document.body.className = `font-inter ${activeTheme}`;
      
      BloomState.theme = activeTheme;
      BloomState.save();
      
      // Redraw canvas with new theme colors
      if (document.getElementById('view-analytics').classList.contains('active')) {
        AnalyticsModule.renderChart();
      }
    });
  }

  // Go Premium Toggle (Simulate Upgrade)
  const premiumBtn = document.getElementById('premium-toggle');
  if (premiumBtn) {
    if (BloomState.premium) {
      premiumBtn.classList.add('premium-active');
      premiumBtn.querySelector('span').innerText = 'Premium Mode';
    }

    premiumBtn.addEventListener('click', () => {
      BloomState.premium = !BloomState.premium;
      
      if (BloomState.premium) {
        premiumBtn.classList.add('premium-active');
        premiumBtn.querySelector('span').innerText = 'Premium Mode';
        
        // Hide simulated ads in premium mode!
        document.querySelector('.admob-sim-banner').style.display = 'none';
        showNotification("👑 Premium Mode enabled! Ads hidden. Premium features unlocked.");
      } else {
        premiumBtn.classList.remove('premium-active');
        premiumBtn.querySelector('span').innerText = 'Simulate Premium';
        
        // Show simulated ads in free mode
        document.querySelector('.admob-sim-banner').style.display = 'flex';
        showNotification("🌿 Free Mode active. Simulated Google AdMob enabled.");
      }

      BloomState.save();
    });
  }
}

// Notification Toast Utility
function showNotification(message) {
  // Check if existing toast, remove it
  const existing = document.querySelector('.toast-notification');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = 'toast-notification';
  toast.innerText = message;
  
  // Custom toast styling inline for self-containment
  Object.assign(toast.style, {
    position: 'fixed',
    bottom: '24px',
    right: '24px',
    background: 'rgba(20, 32, 28, 0.95)',
    border: '1px solid var(--accent-color)',
    color: 'var(--text-main)',
    padding: '12px 24px',
    borderRadius: '12px',
    fontSize: '0.85rem',
    fontWeight: '600',
    boxShadow: '0 8px 32px rgba(0,0,0,0.5), var(--shadow-glow)',
    backdropFilter: 'blur(10px)',
    zIndex: '2000',
    animation: 'toastIn 0.3s cubic-bezier(0.25, 0.8, 0.25, 1) forwards'
  });

  // Inject animation keyframes if not present
  if (!document.getElementById('toast-keyframes')) {
    const style = document.createElement('style');
    style.id = 'toast-keyframes';
    style.innerHTML = `
      @keyframes toastIn {
        from { transform: translateY(20px) scale(0.9); opacity: 0; }
        to { transform: translateY(0) scale(1); opacity: 1; }
      }
    `;
    document.head.appendChild(style);
  }

  document.body.appendChild(toast);

  // Auto clear after 4.5 seconds
  setTimeout(() => {
    toast.style.animation = 'toastIn 0.3s cubic-bezier(0.25, 0.8, 0.25, 1) reverse forwards';
    setTimeout(() => toast.remove(), 300);
  }, 4500);
}

// Load and Initialize everything
window.addEventListener('DOMContentLoaded', () => {
  BloomState.load();
  
  // Apply initial theme
  document.body.className = `font-inter ${BloomState.theme}`;
  
  // Init all sub-modules
  initGeneralApp();
  Router.init();
  TimerModule.init();
  CalendarModule.init();
  HabitModule.init();
  JournalModule.init();
  StoreModule.init();
  AnalyticsModule.init();
  MonetizationSimulator.init();
  
  // Render landing Dashboard views
  DashboardModule.render();
  CalendarModule.renderCalendar();
  
  // Trigger impression for opening the app!
  MonetizationSimulator.trackImpression();

  // Register PWA Service Worker
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js')
        .then(reg => console.log('[Service Worker] Registered with scope:', reg.scope))
        .catch(err => console.error('[Service Worker] Registration failed:', err));
    });
  }
});
