/**
 * ==========================================================================
 * 우글와글 1인 1역할 배정기 - script.js
 * 초등학교 교실을 위한 1인 1역할 랜덤 배정 및 스프레드시트 연동 로직
 * ==========================================================================
 */

// --- 1. 기본 초기 데이터 (학생 12명, 역할 12개) ---
export const DEFAULT_STUDENTS = [
  '김하늘', '이서준', '박지민', '최도윤', '정수아', '강예은',
  '윤민호', '조은우', '한채원', '송시우', '백유진', '임태양'
];

export const DEFAULT_ROLES = [
  { id: 1, icon: '🧼', name: '칠판 청결 요정', desc: '칠판과 분필 지우개를 늘 깨끗하게 닦아요.' },
  { id: 2, icon: '🍱', name: '급식 배식 도우미', desc: '점심시간에 식판 받기와 줄 서기를 도와줘요.' },
  { id: 3, icon: '🥛', name: '우유 간식 당번', desc: '우유 상자를 받아오고 남은 우유를 정리해요.' },
  { id: 4, icon: '💡', name: '에너지 절약 지킴이', desc: '쉬는 시간과 이동 수업 때 전등과 선풍기를 꺼요.' },
  { id: 5, icon: '🌱', name: '식물 반려 매니저', desc: '교실 화분에 시원한 물을 주고 햇볕을 쬐어줘요.' },
  { id: 6, icon: '📚', name: '도서관 정리 요정', desc: '학급문고 책을 번호와 종류별로 바르게 꽂아요.' },
  { id: 7, icon: '⚽', name: '체육 놀이 대장', desc: '체육 시간 공과 준비물을 챙기고 뒷정리를 해요.' },
  { id: 8, icon: '♻️', name: '분리배출 보안관', desc: '재활용 쓰레기와 비닐을 올바른 통에 분류해요.' },
  { id: 9, icon: '🎒', name: '튼튼 줄반장', desc: '이동할 때 친구들이 안전하고 바르게 서도록 도와요.' },
  { id: 10, icon: '🔍', name: '분실물 센터 지킴이', desc: '바닥에 떨어진 연필과 지우개 주인을 찾아줘요.' },
  { id: 11, icon: '💻', name: '스마트 방송 도우미', desc: '수업용 TV와 태블릿 충전함을 안전하게 관리해요.' },
  { id: 12, icon: '🌟', name: '다정다감 칭찬 배달원', desc: '친구들에게 고운 말과 따뜻한 칭찬을 선물해요.' }
];

// --- 2. 앱 전역 상태 (Application State) ---
class AppState {
  constructor() {
    this.students = this.loadFromStorage('class_roles_students', DEFAULT_STUDENTS);
    this.roles = this.loadFromStorage('class_roles_list', DEFAULT_ROLES);
    this.assignments = this.loadFromStorage('class_roles_assignments', []);
    this.className = localStorage.getItem('class_roles_class_name') || '3학년 2반';
    this.isSoundEnabled = localStorage.getItem('class_roles_sound') !== 'false';
    this.currentView = 'card'; // 'card' or 'table'
    this.searchQuery = '';
    this.isShuffling = false;
  }

  loadFromStorage(key, fallback) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : fallback;
    } catch {
      return fallback;
    }
  }

  save() {
    localStorage.setItem('class_roles_students', JSON.stringify(this.students));
    localStorage.setItem('class_roles_list', JSON.stringify(this.roles));
    localStorage.setItem('class_roles_assignments', JSON.stringify(this.assignments));
    localStorage.setItem('class_roles_class_name', this.className);
    localStorage.setItem('class_roles_sound', this.isSoundEnabled);
  }
}

const state = new AppState();

// --- 3. 효과음 재생 엔진 (Web Audio API Synthesizer) ---
class SoundManager {
  constructor() {
    this.ctx = null;
  }

  init() {
    if (!this.ctx && (window.AudioContext || window.webkitAudioContext)) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playPop() {
    if (!state.isSoundEnabled) return;
    this.init();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.08);
    } catch {
      // Audio fallback silent
    }
  }

  playFanfare() {
    if (!state.isSoundEnabled) return;
    this.init();
    if (!this.ctx) return;

    try {
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.09);

        gain.gain.setValueAtTime(0, this.ctx.currentTime + idx * 0.09);
        gain.gain.linearRampToValueAtTime(0.25, this.ctx.currentTime + idx * 0.09 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + idx * 0.09 + 0.4);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(this.ctx.currentTime + idx * 0.09);
        osc.stop(this.ctx.currentTime + idx * 0.09 + 0.45);
      });
    } catch {
      // Audio fallback silent
    }
  }
}

const soundManager = new SoundManager();

// --- 4. 축하 컨페티 효과 (HTML5 Canvas Confetti) ---
class ConfettiEffect {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
    this.particles = [];
    this.animationFrame = null;
    this.colors = ['#F59E0B', '#10B981', '#3B82F6', '#EC4899', '#8B5CF6', '#F43F5E', '#FBBF24'];
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    if (!this.canvas) return;
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  burst(count = 70) {
    if (!this.canvas || !this.ctx) return;
    this.resize();
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: this.canvas.width / 2 + (Math.random() - 0.5) * 300,
        y: this.canvas.height * 0.45,
        w: Math.random() * 10 + 6,
        h: Math.random() * 8 + 4,
        color: this.colors[Math.floor(Math.random() * this.colors.length)],
        vx: (Math.random() - 0.5) * 14,
        vy: (Math.random() - 0.8) * 16 - 4,
        angle: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 12,
        alpha: 1,
        gravity: 0.45
      });
    }
    if (!this.animationFrame) {
      this.animate();
    }
  }

  animate() {
    if (!this.ctx) return;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity;
      p.vx *= 0.98;
      p.angle += p.rotSpeed;
      p.alpha -= 0.012;

      if (p.alpha <= 0 || p.y > this.canvas.height + 20) {
        this.particles.splice(i, 1);
        continue;
      }

      this.ctx.save();
      this.ctx.translate(p.x, p.y);
      this.ctx.rotate((p.angle * Math.PI) / 180);
      this.ctx.globalAlpha = Math.max(0, p.alpha);
      this.ctx.fillStyle = p.color;
      this.ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      this.ctx.restore();
    }

    if (this.particles.length > 0) {
      this.animationFrame = requestAnimationFrame(() => this.animate());
    } else {
      this.animationFrame = null;
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }
}

const confetti = new ConfettiEffect('confettiCanvas');

// --- 5. 토스트 알림 헬퍼 ---
function showToast(message, icon = '✨') {
  const toast = document.getElementById('toastNotice');
  const msgEl = document.getElementById('toastMessage');
  const iconEl = document.getElementById('toastIcon');
  if (!toast || !msgEl) return;

  msgEl.textContent = message;
  if (iconEl) iconEl.textContent = icon;
  toast.classList.add('show');

  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => {
    toast.classList.remove('show');
  }, 2600);
}

// --- 6. 피셔-예이츠 셔플 알고리즘 (Fisher-Yates Shuffle) ---
function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// --- 7. 메인 역할 배정 실행 로직 ---
function assignRolesWithAnimation() {
  if (state.isShuffling) return;
  if (state.students.length === 0 || state.roles.length === 0) {
    showToast('학생 또는 역할 목록이 비어 있습니다.', '⚠️');
    return;
  }

  soundManager.init();
  state.isShuffling = true;
  const cards = document.querySelectorAll('.role-card');
  cards.forEach(card => card.classList.add('shuffling'));

  let ticks = 0;
  const maxTicks = 12;
  const interval = setInterval(() => {
    ticks++;
    soundManager.playPop();

    // 임시 셔플 미리보기 시뮬레이션
    const tempShuffled = shuffleArray(state.students);
    renderCards(tempShuffled, true);

    if (ticks >= maxTicks) {
      clearInterval(interval);
      finalizeAssignment();
    }
  }, 80);
}

function finalizeAssignment() {
  // 실제 최종 셔플
  const shuffledStudents = shuffleArray(state.students);
  const newAssignments = [];

  const count = Math.max(state.roles.length, state.students.length);
  for (let i = 0; i < count; i++) {
    const role = state.roles[i] || { id: i + 1, icon: '🌟', name: `자율 역할 ${i + 1}`, desc: '학급 자치 자율 역할' };
    const student = shuffledStudents[i] || '미배정';
    newAssignments.push({
      roleId: role.id,
      roleName: role.name,
      roleIcon: role.icon,
      roleDesc: role.desc,
      studentName: student
    });
  }

  state.assignments = newAssignments;
  state.isShuffling = false;
  state.save();

  renderAllViews();
  soundManager.playFanfare();
  confetti.burst(90);
  showToast('🎉 1인 1역할 배정이 멋지게 완료되었습니다!', '🎊');
}

// 초기화
function resetAssignments() {
  state.assignments = [];
  state.save();
  renderAllViews();
  showToast('역할 배정 결과가 초기화되었습니다.', '🧹');
}

// --- 8. 렌더링 함수들 ---
function renderAllViews() {
  updateStats();
  renderCards();
  renderTable();
  updatePrintHeader();
}

function updateStats() {
  const studentCountEl = document.getElementById('statStudentCount');
  const roleCountEl = document.getElementById('statRoleCount');
  const assignStatusEl = document.getElementById('statAssignStatus');

  if (studentCountEl) studentCountEl.textContent = `${state.students.length}명`;
  if (roleCountEl) roleCountEl.textContent = `${state.roles.length}개`;

  if (assignStatusEl) {
    if (state.assignments.length > 0) {
      assignStatusEl.textContent = '배정 완료 ✅';
      assignStatusEl.style.color = '#059669';
    } else {
      assignStatusEl.textContent = '배정 대기 중 ⏳';
      assignStatusEl.style.color = '#D97706';
    }
  }
}

function updatePrintHeader() {
  const titleEl = document.getElementById('printClassTitle');
  const dateEl = document.getElementById('printDateText');
  const today = new Date();
  const dateStr = `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일`;

  if (titleEl) {
    titleEl.textContent = `🏫 ${state.className} 1인 1역할 배정표`;
  }
  if (dateEl) {
    dateEl.textContent = `배정일: ${dateStr}`;
  }
}

// 카드 뷰 렌더링
function renderCards(tempStudentList = null, isPreview = false) {
  const grid = document.getElementById('cardsGrid');
  if (!grid) return;

  const query = state.searchQuery.trim().toLowerCase();
  grid.innerHTML = '';

  const displayList = state.roles.map((role, idx) => {
    let studentName = '미배정';
    if (tempStudentList) {
      studentName = tempStudentList[idx] || '미배정';
    } else if (state.assignments.length > 0) {
      const match = state.assignments.find(a => a.roleId === role.id) || state.assignments[idx];
      studentName = match ? match.studentName : '미배정';
    }
    return {
      index: idx + 1,
      role,
      studentName
    };
  });

  const filtered = displayList.filter(item => {
    if (!query) return true;
    return (
      item.studentName.toLowerCase().includes(query) ||
      item.role.name.toLowerCase().includes(query) ||
      item.role.desc.toLowerCase().includes(query)
    );
  });

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align:center; padding: 40px; background:#FFFFFF; border-radius:16px; border: 2px dashed #CBD5E1;">
        <span style="font-size:2.5rem;">🔍</span>
        <h3 style="font-size:1.1rem; margin-top:8px; color:#4B5563;">검색 결과와 일치하는 학생이나 역할이 없어요.</h3>
        <p style="color:#9CA3AF; font-size:0.9rem;">검색어를 다시 확인해 주세요.</p>
      </div>
    `;
    return;
  }

  filtered.forEach(item => {
    const { role, studentName, index } = item;
    const isAssigned = studentName !== '미배정';
    const themeClass = `card-theme-${(index - 1) % 6}`;

    const card = document.createElement('div');
    card.className = `role-card ${themeClass} ${isPreview ? 'shuffling' : (isAssigned ? 'assigned-pop' : '')}`;
    
    // 학생 첫 글자 아바타
    const initial = isAssigned ? studentName.charAt(0) : '?';

    card.innerHTML = `
      <div class="card-top">
        <div class="role-icon-box" title="${role.name}">
          <span>${role.icon || '🌟'}</span>
        </div>
        <span class="card-number-badge">역할 #${index}</span>
      </div>

      <div class="role-info">
        <h3 class="role-title">${role.name}</h3>
        <p class="role-desc">${role.desc}</p>
      </div>

      <div class="student-slot ${isAssigned ? 'assigned' : 'unassigned'}">
        <div class="student-info">
          <div class="student-avatar">${initial}</div>
          <div class="student-name-box">
            <span class="student-label">담당 학생</span>
            <span class="student-name">${studentName}</span>
          </div>
        </div>
        ${!isPreview ? `
          <button class="btn-card-swap" data-role-id="${role.id}" title="담당 학생 수동 변경 및 교환">
            🔄
          </button>
        ` : ''}
      </div>
    `;

    // Swap 버튼 클릭 리스너 연결
    const swapBtn = card.querySelector('.btn-card-swap');
    if (swapBtn) {
      swapBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        openSwapModal(role.id, role.name, studentName);
      });
    }

    grid.appendChild(card);
  });
}

// 표(게시판) 뷰 렌더링
function renderTable() {
  const tbody = document.getElementById('boardTableBody');
  if (!tbody) return;

  tbody.innerHTML = '';
  const query = state.searchQuery.trim().toLowerCase();

  state.roles.forEach((role, idx) => {
    let studentName = '미배정';
    if (state.assignments.length > 0) {
      const match = state.assignments.find(a => a.roleId === role.id) || state.assignments[idx];
      studentName = match ? match.studentName : '미배정';
    }

    if (query) {
      const matchQuery = (
        studentName.toLowerCase().includes(query) ||
        role.name.toLowerCase().includes(query) ||
        role.desc.toLowerCase().includes(query)
      );
      if (!matchQuery) return;
    }

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="col-num">${idx + 1}</td>
      <td class="col-student">${studentName}</td>
      <td class="col-role">${role.icon || '🌟'} ${role.name}</td>
      <td class="col-desc">${role.desc}</td>
      <td class="col-stamp">
        <span class="stamp-box-demo" title="참 잘했어요 스탬프 자리"></span>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// --- 9. 수동 학생 역할 교환 (Swap Modal) ---
let currentSwapRoleId = null;

function openSwapModal(roleId, roleName, currentStudent) {
  currentSwapRoleId = roleId;
  const modal = document.getElementById('swapModal');
  const titleInfo = document.getElementById('swapTargetRoleInfo');
  const select = document.getElementById('selectSwapStudent');
  if (!modal || !select) return;

  titleInfo.textContent = `🌟 ${roleName} (현재: ${currentStudent})`;
  select.innerHTML = '';

  state.students.forEach(name => {
    const opt = document.createElement('option');
    opt.value = name;
    opt.textContent = name === currentStudent ? `${name} (현재 담당)` : name;
    if (name === currentStudent) opt.selected = true;
    select.appendChild(opt);
  });

  openModal('swapModal');
}

function handleConfirmSwap() {
  const select = document.getElementById('selectSwapStudent');
  if (!select || !currentSwapRoleId) return;
  const targetStudent = select.value;

  // 배정이 아직 안 되어 있으면 기본 배정 뼈대 먼저 생성
  if (state.assignments.length === 0) {
    state.assignments = state.roles.map((r, i) => ({
      roleId: r.id,
      roleName: r.name,
      roleIcon: r.icon,
      roleDesc: r.desc,
      studentName: state.students[i] || '미배정'
    }));
  }

  const currentRoleAssign = state.assignments.find(a => a.roleId === currentSwapRoleId);
  if (!currentRoleAssign) return;

  const previousStudent = currentRoleAssign.studentName;

  // targetStudent가 이미 다른 역할을 맡고 있는지 확인 후 맞교환(swap)
  const otherRoleAssign = state.assignments.find(a => a.studentName === targetStudent && a.roleId !== currentSwapRoleId);
  if (otherRoleAssign) {
    otherRoleAssign.studentName = previousStudent;
  }
  currentRoleAssign.studentName = targetStudent;

  state.save();
  renderAllViews();
  closeModal('swapModal');
  soundManager.playPop();
  showToast(`${targetStudent} 학생으로 역할이 안전하게 변경되었습니다.`, '🤝');
}

// --- 10. 명단 & 역할 관리 모달 (Manage Modal) ---
function openManageModal() {
  const txtStudents = document.getElementById('textareaStudents');
  const txtRoles = document.getElementById('textareaRoles');
  const countStudentEl = document.getElementById('manageStudentCount');
  const countRoleEl = document.getElementById('manageRoleCount');

  if (txtStudents) {
    txtStudents.value = state.students.join('\n');
    if (countStudentEl) countStudentEl.textContent = state.students.length;
  }

  if (txtRoles) {
    txtRoles.value = state.roles.map(r => `${r.icon || '🌟'} ${r.name} : ${r.desc}`).join('\n');
    if (countRoleEl) countRoleEl.textContent = state.roles.length;
  }

  openModal('manageModal');
}

function handleSaveManagement() {
  const txtStudents = document.getElementById('textareaStudents');
  const txtRoles = document.getElementById('textareaRoles');

  if (txtStudents) {
    const studentList = txtStudents.value
      .split('\n')
      .map(s => s.trim())
      .filter(s => s.length > 0);
    if (studentList.length > 0) {
      state.students = studentList;
    }
  }

  if (txtRoles) {
    const rawRoles = txtRoles.value
      .split('\n')
      .map(r => r.trim())
      .filter(r => r.length > 0);

    const parsedRoles = rawRoles.map((line, idx) => {
      // 이모지 및 콜론 파싱: "🧼 칠판 요정 : 설명" 또는 "칠판 요정 : 설명"
      let icon = '🌟';
      let name = line;
      let desc = '우리 반을 돕는 소중한 역할';

      if (line.includes(':')) {
        const parts = line.split(':');
        name = parts[0].trim();
        desc = parts.slice(1).join(':').trim();
      }

      // 첫 글자가 이모지인지 체크 (공백 기준 분리)
      const firstToken = name.split(' ')[0];
      const matchEmoji = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u.test(firstToken);
      if (matchEmoji) {
        icon = firstToken;
        name = name.substring(firstToken.length).trim();
      }

      return {
        id: idx + 1,
        icon: icon || '🌟',
        name: name || `역할 ${idx + 1}`,
        desc: desc || '우리 반을 돕는 소중한 역할'
      };
    });

    if (parsedRoles.length > 0) {
      state.roles = parsedRoles;
    }
  }

  // 명단이 바뀌었으므로 기존 배정 초기화 안내
  state.assignments = [];
  state.save();
  renderAllViews();
  closeModal('manageModal');
  showToast('학생 및 역할 목록이 성공적으로 업데이트되었습니다.', '💾');
}

function handleResetToDefault() {
  if (confirm('기본 예시 데이터(학생 12명, 역할 12개)로 다시 되돌리시겠습니까?')) {
    state.students = [...DEFAULT_STUDENTS];
    state.roles = [...DEFAULT_ROLES];
    state.assignments = [];
    state.save();

    const txtStudents = document.getElementById('textareaStudents');
    const txtRoles = document.getElementById('textareaRoles');
    if (txtStudents) txtStudents.value = state.students.join('\n');
    if (txtRoles) txtRoles.value = state.roles.map(r => `${r.icon} ${r.name} : ${r.desc}`).join('\n');

    renderAllViews();
    showToast('기본 예시 12명 데이터로 복원되었습니다.', '🔄');
  }
}

// --- 11. 구글 스프레드시트 (Apps Script) 연동 훅 ---

// [🔄 시트 불러오기 모달]
function openSheetLoadModal() {
  const inputUrl = document.getElementById('inputLoadScriptUrl');
  const savedUrl = localStorage.getItem('class_roles_sheet_load_url');
  if (inputUrl && savedUrl) {
    inputUrl.value = savedUrl;
  }
  openModal('sheetLoadModal');
}

async function handleExecuteSheetLoad() {
  const inputUrl = document.getElementById('inputLoadScriptUrl');
  const url = inputUrl ? inputUrl.value.trim() : '';

  if (!url) {
    showToast('Apps Script 웹 앱 URL을 입력해 주세요. (또는 테스트 버튼 사용)', '⚠️');
    return;
  }

  localStorage.setItem('class_roles_sheet_load_url', url);
  showToast('구글 시트에서 명단을 가져오는 중...', '⏳');

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('네트워크 응답 오류');
    const data = await response.json();

    if (data.students && Array.isArray(data.students)) {
      state.students = data.students;
    }
    if (data.roles && Array.isArray(data.roles)) {
      state.roles = data.roles;
    }

    state.assignments = [];
    state.save();
    renderAllViews();
    closeModal('sheetLoadModal');
    showToast('구글 시트에서 데이터를 성공적으로 가져왔습니다!', '🎉');
  } catch (err) {
    console.error(err);
    showToast('시트 연결에 실패했습니다. Apps Script 배포 설정 및 CORS를 확인해 주세요.', '❌');
  }
}

function handleMockSheetLoad() {
  showToast('가상 구글 시트 연동 시뮬레이션 성공!', '⚡');
  state.students = [
    '강바람', '고하은', '구민재', '노도현', '류지안', '문선우',
    '서다은', '안우진', '유채린', '전태린', '황보현', '차은성'
  ];
  state.assignments = [];
  state.save();
  renderAllViews();
  closeModal('sheetLoadModal');
}

// CSV 파일 업로드 파서
function handleCsvUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    const text = event.target.result;
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const newStudents = [];
    const newRoles = [];

    lines.forEach((line, idx) => {
      if (idx === 0 && line.includes('학생')) return; // 헤더 스킵
      const cols = line.split(',').map(c => c.trim().replace(/^"|"$/g, ''));
      if (cols[0]) newStudents.push(cols[0]);
      if (cols[1]) {
        newRoles.push({
          id: newRoles.length + 1,
          icon: cols[3] || '🌟',
          name: cols[1],
          desc: cols[2] || '학급을 위한 소중한 역할'
        });
      }
    });

    if (newStudents.length > 0) state.students = newStudents;
    if (newRoles.length > 0) state.roles = newRoles;

    state.assignments = [];
    state.save();
    renderAllViews();
    closeModal('sheetLoadModal');
    showToast(`${newStudents.length}명의 명단과 역할을 CSV에서 가져왔습니다!`, '📁');
  };
  reader.readAsText(file, 'utf-8');
}

// [💾 시트에 결과 저장 모달]
function openSheetSaveModal() {
  const inputUrl = document.getElementById('inputSaveScriptUrl');
  const savedUrl = localStorage.getItem('class_roles_sheet_save_url');
  if (inputUrl && savedUrl) {
    inputUrl.value = savedUrl;
  }

  // JSON Preview
  const preview = document.getElementById('jsonPreviewBox');
  if (preview) {
    const payload = {
      className: state.className,
      updatedAt: new Date().toISOString(),
      assignments: state.assignments.length > 0 ? state.assignments : state.roles.map((r, i) => ({
        roleName: r.name,
        roleDesc: r.desc,
        studentName: state.students[i] || '미배정'
      }))
    };
    preview.textContent = JSON.stringify(payload, null, 2);
  }

  openModal('sheetSaveModal');
}

async function handleExecuteSheetSave() {
  const inputUrl = document.getElementById('inputSaveScriptUrl');
  const url = inputUrl ? inputUrl.value.trim() : '';

  if (!url) {
    showToast('Apps Script 웹 앱 URL을 입력해 주세요. (또는 클립보드 복사 이용)', '⚠️');
    return;
  }

  localStorage.setItem('class_roles_sheet_save_url', url);
  showToast('구글 시트로 데이터를 전송하는 중...', '⏳');

  try {
    const payload = {
      className: state.className,
      date: new Date().toLocaleDateString('ko-KR'),
      assignments: state.assignments
    };

    // Google Apps Script 웹 앱으로 전송
    await fetch(url, {
      method: 'POST',
      mode: 'no-cors', // Apps Script standard redirect bypass
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    closeModal('sheetSaveModal');
    showToast('구글 스프레드시트로 결과가 안전하게 전송되었습니다!', '💾');
  } catch (err) {
    console.error(err);
    showToast('전송 중 오류가 발생했습니다. Apps Script 설정을 확인해 주세요.', '❌');
  }
}

// 클립보드 복사 (스프레드시트에 바로 붙여넣을 수 있는 TSV 포맷)
function copyToClipboardForSheets() {
  let tsv = '번호\t학생 이름\t담당 역할\t역할 설명\n';
  const list = state.roles.map((role, idx) => {
    let studentName = '미배정';
    if (state.assignments.length > 0) {
      const match = state.assignments.find(a => a.roleId === role.id) || state.assignments[idx];
      studentName = match ? match.studentName : '미배정';
    }
    return `${idx + 1}\t${studentName}\t${role.name}\t${role.desc}`;
  });

  tsv += list.join('\n');

  navigator.clipboard.writeText(tsv).then(() => {
    showToast('스프레드시트에 붙여넣을 수 있도록 클립보드에 복사되었습니다! (Ctrl+V)', '📋');
  }).catch(() => {
    showToast('클립보드 복사에 실패했습니다.', '⚠️');
  });
}

// CSV 파일 다운로드
function exportCsv() {
  let csv = '\uFEFF번호,학생이름,역할이름,역할설명\n';
  state.roles.forEach((role, idx) => {
    let studentName = '미배정';
    if (state.assignments.length > 0) {
      const match = state.assignments.find(a => a.roleId === role.id) || state.assignments[idx];
      studentName = match ? match.studentName : '미배정';
    }
    csv += `${idx + 1},"${studentName}","${role.name}","${role.desc}"\n`;
  });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${state.className}_1인1역할_배정결과.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast('CSV 파일이 다운로드되었습니다.', '📥');
}

// --- 12. 모달 열기/닫기 헬퍼 ---
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.add('open');
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.remove('open');
}

// --- 13. 이벤트 리스너 바인딩 (Event Listeners Setup) ---
function setupEventListeners() {
  // 메인 역할 배정 버튼
  const btnAssign = document.getElementById('btnAssignRoles');
  if (btnAssign) {
    btnAssign.addEventListener('click', assignRolesWithAnimation);
  }

  // 다시 섞기 버튼
  const btnReshuffle = document.getElementById('btnReshuffle');
  if (btnReshuffle) {
    btnReshuffle.addEventListener('click', assignRolesWithAnimation);
  }

  // 초기화 버튼
  const btnReset = document.getElementById('btnResetAssignments');
  if (btnReset) {
    btnReset.addEventListener('click', () => {
      if (confirm('현재 배정 결과를 초기화하시겠습니까?')) {
        resetAssignments();
      }
    });
  }

  // 인쇄 버튼
  const btnPrint = document.getElementById('btnPrintBoard');
  if (btnPrint) {
    btnPrint.addEventListener('click', () => {
      updatePrintHeader();
      window.print();
    });
  }

  // 음향 토글 버튼
  const btnSound = document.getElementById('btnToggleSound');
  const soundIcon = document.getElementById('soundIcon');
  if (btnSound) {
    btnSound.addEventListener('click', () => {
      state.isSoundEnabled = !state.isSoundEnabled;
      state.save();
      if (state.isSoundEnabled) {
        btnSound.classList.add('active');
        btnSound.innerHTML = '<span>🔊</span> 효과음 ON';
        soundManager.playPop();
        showToast('효과음이 켜졌습니다.', '🔊');
      } else {
        btnSound.classList.remove('active');
        btnSound.innerHTML = '<span>🔇</span> 효과음 OFF';
        showToast('효과음이 꺼졌습니다.', '🔇');
      }
    });
  }

  // 학급 명칭 수정
  const inputClassName = document.getElementById('inputClassName');
  if (inputClassName) {
    inputClassName.value = state.className;
    inputClassName.addEventListener('input', (e) => {
      state.className = e.target.value.trim() || '우리 반';
      state.save();
      updatePrintHeader();
    });
  }

  // 검색 인풋
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      state.searchQuery = e.target.value;
      if (state.currentView === 'card') {
        renderCards();
      } else {
        renderTable();
      }
    });
  }

  // 뷰 전환 탭
  const tabCard = document.getElementById('tabCardView');
  const tabTable = document.getElementById('tabTableView');
  const gridContainer = document.getElementById('cardsGrid');
  const tableContainer = document.getElementById('tableViewContainer');

  if (tabCard && tabTable) {
    tabCard.addEventListener('click', () => {
      state.currentView = 'card';
      tabCard.classList.add('active');
      tabTable.classList.remove('active');
      if (gridContainer) gridContainer.style.display = 'grid';
      if (tableContainer) tableContainer.style.display = 'none';
      renderCards();
    });

    tabTable.addEventListener('click', () => {
      state.currentView = 'table';
      tabTable.classList.add('active');
      tabCard.classList.remove('active');
      if (gridContainer) gridContainer.style.display = 'none';
      if (tableContainer) tableContainer.style.display = 'block';
      renderTable();
    });
  }

  // 모달 버튼들 바인딩
  document.getElementById('btnOpenLoadSheet')?.addEventListener('click', openSheetLoadModal);
  document.getElementById('btnOpenSaveSheet')?.addEventListener('click', openSheetSaveModal);
  document.getElementById('btnOpenManageModal')?.addEventListener('click', openManageModal);

  document.getElementById('btnExecuteSheetLoad')?.addEventListener('click', handleExecuteSheetLoad);
  document.getElementById('btnMockSheetLoad')?.addEventListener('click', handleMockSheetLoad);
  document.getElementById('btnExecuteSheetSave')?.addEventListener('click', handleExecuteSheetSave);
  document.getElementById('btnCopyClipboard')?.addEventListener('click', copyToClipboardForSheets);
  document.getElementById('btnExportCsv')?.addEventListener('click', exportCsv);
  document.getElementById('btnSaveManagement')?.addEventListener('click', handleSaveManagement);
  document.getElementById('btnResetToDefault')?.addEventListener('click', handleResetToDefault);
  document.getElementById('btnConfirmSwap')?.addEventListener('click', handleConfirmSwap);

  // CSV 파일 업로드 트리거
  const btnQuickCsv = document.getElementById('btnQuickCsvLoad');
  const fileInput = document.getElementById('fileCsvInput');
  if (btnQuickCsv && fileInput) {
    btnQuickCsv.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', handleCsvUpload);
  }

  // 모달 닫기 버튼들 일괄 바인딩
  document.querySelectorAll('[data-close]').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-close');
      closeModal(targetId);
    });
  });

  // 모달 배경 클릭 시 닫기
  document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) {
        backdrop.classList.remove('open');
      }
    });
  });

  // 오늘 날짜 표시
  const todayDatePill = document.getElementById('todayDatePill');
  if (todayDatePill) {
    const today = new Date();
    todayDatePill.textContent = `배정일: ${today.getMonth() + 1}월 ${today.getDate()}일`;
  }
}

// --- 14. 앱 초기화 실행 (DOM Ready) ---
document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
  renderAllViews();
});

// 즉시 1회 렌더링 (모듈 로딩 타이밍 대비)
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  setupEventListeners();
  renderAllViews();
}
