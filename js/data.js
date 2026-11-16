/* ============================================================
   The Signal — 콘텐츠 데이터
   텍스트·이미지·영상·시간 설정은 이 파일에서만 바꾸면 됩니다.
   좌표는 모두 1920×1080 피그마 프레임 기준입니다.
   ============================================================ */
const DATA = {

  /* 시간 설정 (ms) */
  timing: {
    cardHold: 1800,        // Scene #1_night, #2_overnight 유지 시간
    guideHold: 5000,       // 가이드 라인 유지 시간
    videoMissingHold: 2600,// 영상 파일이 없을 때 자리만 보여주는 시간
    videoFadeBefore: 0.9,  // 영상이 끝나기 몇 초 전에 fade out 을 시작할지
    videoStallLimit: 6,    // 영상이 이 시간(초) 동안 멈춰 있으면 다음 씬으로 넘김
    miniHold: 2200,        // inventory_mini 가 올라와 있는 시간
    captionHold: 2400,     // 하단 문구 유지 시간
    itemHold: 2600,        // 아이템·신문지 화면이 떠 있다가 자동으로 닫히기까지의 시간
    panelIdle: 7000,       // 제어실 판넬: 이 시간 동안 아무 버튼도 누르지 않으면 자동으로 닫힘
    failHold: 3500,        // 미니게임 실패 화면 유지 시간
    endingHold: 3200,      // ending, ending_1 유지 시간
    trueEndingHold: 3200,  // true ending_1 ~ 3, bad ending_1 ~ 3 유지 시간
    resultHold: 4000,      // true / bad ending 결과 화면 유지 시간
    choiceTime: 10,        // ending_2 선택 타이머(초)
    creditRoll: 20000      // 크레딧이 위로 올라가는 시간
  },

  /* 그래픽 밝기 단계 (설정 창의 눈금 5칸). 기본값은 마지막 칸 */
  brightness: [0.6, 0.7, 0.8, 0.9, 1],

  /* 사운드: 파일은 assets/audio/ . gain = 음원별 기본 크기(0~1) */
  audio: {
    levels: [0, 0.25, 0.5, 0.75, 1],   // 설정 창 슬라이더 눈금 5칸 (맨 왼쪽 = 끔)
    bgmLevel: 4, sfxLevel: 4,          // 처음 슬라이더 위치 (0~4)
    /* 배경음악 (설정의 '배경음악' 슬라이더) */
    bgm: {
      main2: { file: 'game_main_sound_2.m4a', gain: 0.5 },    // 모든 페이지. 효과음보다 약간 작게
      main1: { file: 'game_main_sound_1.mp3', gain: 0.12 }    // 제어실(lab) ~ 엔딩. main2 보다 약간 작게 (원본 음원이 커서 값은 더 작음)
    },
    main1Scenes: /^(lab|ending|ending_\d|(true|bad)_ending_.+)$/,                    // main1 이 함께 들리는 씬
    silentScenes: /^(intro_animation|chapter_[1-4]|max_scream)$/,                    // 배경음악 두 개가 모두 안 들리는 씬
    fade: 900,            // 배경음악이 켜지고 꺼질 때의 fade (ms)
    main1ToIntro: 4000,   // intro 로 돌아갈 때 main1 이 천천히 사라지는 시간 (ms)
    /* 효과음 (설정의 '효과음' 슬라이더) */
    sfx: {
      intro_animation: { file: 'intro_animation.mp3', gain: 1 },   // intro animation 영상과 함께
      chapter:         { file: 'chapter_sound.mp3',   gain: 1 },   // chapter_1~4 영상과 함께
      max_scream:      { file: 'max_scream.mp3',      gain: 1 },   // Scene #2_max_scream 영상과 함께
      car:             { file: 'car_sound.mp3',       gain: 1 },   // Scene #1_billy_1 화면이 흔들릴 때
      tangle:          { file: 'tangle_sound.mp3',    gain: 1 }    // 미니게임에서 billy_vecna 가 한 장 사라질 때
    }
  },

  /* intro_chapter: 챕터 이름·제목, 누르면 이동할 씬 */
  chapters: [
    { name: 'CHAPTER 1.', title: '평소와 다를 바 없는 여느 여름방학', scene: 'chapter_1' },
    { name: 'CHAPTER 2.', title: '빌리의 몸에서 설명할 수 없는 변화가 시작되다', scene: 'chapter_2' },
    { name: 'CHAPTER 3.', title: '사라진 맥스', scene: 'chapter_3' },
    { name: 'CHAPTER 4.', title: '실험실 깊숙한 곳에서 다시 마주한 문', scene: 'chapter_4' }
  ],

  /* intro_credit 내용 */
  credits: [
    ['GAME DIRECTION', 'Director', ['CHOI HAMIN']],
    ['SUBJECT DIRECTION', 'Director', ['KANG IL']],
    ['GAME DESIGN', 'Game Planning / Level Design / Puzzle Design', ['CHOI HAMIN']],
    ['3D & ANIMATION', '3D Modeling / Texturing / Animation', ['CHOI HAMIN']],
    ['TOOLS & SOFTWARE', 'Production Tools', ['C4D / OCTANE / Figma']],
    ['DEVELOPMENT', 'Programming / Game Development', ['CLAUDE / CHAT GPT']],
    ['VIDEO PRODUCTION', 'Trailer / Cinematic Sequence', ['CHOI HAMIN']],
    ['ASSET SOURCES', 'External Assets & Resources', ['CHOI HAMIN']],
    ['COPYRIGHT NOTICE', null, null, [
      'This is a non-commercial fan-made project inspired by Stranger Things.',
      'All original characters, names, and related properties belong to their respective copyright holders.',
      'This project is created for educational and exhibition purposes only and is not affiliated with or endorsed by Netflix.']],
    ['SPECIAL THANKS', 'A GAME CREATED WITH PASSION.', ['SUJIN / YERI / MOONSU / KUNWOO', 'SINCERELY LOVE TO MY FAMILY']]
  ],
  creditThanks: 'THANK YOU FOR PLAYING!',

  /* 영상 파일: assets/video/ 에 같은 이름으로 넣으면 재생됩니다 */
  video: {
    intro: 'intro.mp4',
    chapter_1: 'chapter_1.mp4',
    intro_animation: 'intro_animation.mp4',
    billy: 'billy.mp4',
    chapter_2: 'chapter_2.mp4',
    max_scream: 'max_scream.mp4',
    chapter_3: 'chapter_3.mp4',
    chapter_4: 'chapter_4.mp4'
  },

  /* 대화 씬: ch = 일러스트, x/y = 위치, bub = 말풍선, t = 대사 */
  scene1: {
    bg: 'bg_scene1.jpg',
    lines: [
      { ch: 'ch_billy.webp',        x: 1114, y: 11, bub: 'bubble_billy.webp', t: '맥스! 앞 보면서 걸어.' },
      { ch: 'ch_max_annoy.webp',    x: 198,  y: 20, bub: 'bubble_max.webp',   t: '저 인간 진짜... 오지랖이야' },
      { ch: 'ch_mike_curious.webp', x: 1088, y: 0,  bub: 'bubble_mike.webp',  t: '오빠?' },
      { ch: 'ch_max_annoy.webp',    x: 199,  y: 20, bub: 'bubble_max.webp',   t: '그렇게 부르지마. 기분 나빠...' },
      { ch: 'ch_mike_smile.webp',   x: 991,  y: 0,  bub: 'bubble_mike.webp',  t: '알았어 알았어! 오늘 스타코트에 일레븐도 같이 데려가자!' }
    ]
  },
  billy: {
    bg: 'bg_abandoned.jpg',
    lines: [
      { ch: 'ch_billy_wide.webp', x: 1175, y: 19, bub: 'bubble_b1.webp', t: '쾅-!!!', big: true },
      { ch: 'ch_billy_wide.webp', x: 1175, y: 19, bub: 'bubble_b2.webp', t: '뭐야…? 저기요…?' }
    ]
  },
  scene2: {
    bg: 'bg_scene2.jpg',
    lines: [
      { ch: 'ch_max_worry.webp',      x: 259,  y: 42, bub: 'bubble_max.webp',    t: '요즘 빌리가 이상해...' },
      { ch: 'ch_will_terrified.webp', x: 1058, y: 33, bub: 'bubble_will.webp',   t: '나도 요즘 비슷하게 느끼고 있었어...!' },
      { ch: 'ch_eleven_worry.webp',   x: 226,  y: 98, bub: 'bubble_eleven.webp', t: '뒤집힌 세계야! 틀림없어' },
      { ch: 'ch_lucas_curious.webp',  x: 920,  y: 38, bub: 'bubble_lucas.webp',  t: '맥스! 위험하면 언제든 워키토키를 켜!' }
    ]
  },
  scene3: {
    bg: 'bg_scene3.jpg',
    lines: [
      { ch: 'ch_mike_worry.webp', x: 229, y: 0, bub: 'bubble_mike.webp', t: '이 새벽에 방금 그런 소리를 들었는데 안전할리가 없잖아! 어떻게든 들어가서 맥스를 찾아보자!' }
    ]
  },
  scene4: {
    bg: 'bg_scene4.jpg',
    lines: [
      { ch: 'ch_will_worry.webp', x: 210, y: 35, bub: 'bubble_will.webp', t: '아아…젠장…결국 돌고 돌아 여기냐고!! 이 실험실은 터뜨러버려야 해!!' }
    ]
  },

  /* 미니게임 */
  minigame: {
    perDot: 6, total: 18,
    time: 20,                 // 타이머(초). gauge 가 이 시간 동안 줄어듭니다
    dots: [
      { x: 944,  y: 290, vecna: 'mg_vecna1.webp', vx: 551,  vy: 0 },   // 상단 원 → billy_vecna 1
      { x: 676,  y: 673, vecna: 'mg_vecna2.webp', vx: 0,    vy: 428 }, // 왼쪽 원 → billy_vecna 2
      { x: 1311, y: 688, vecna: 'mg_vecna3.webp', vx: 1242, vy: 456 }  // 오른쪽 원 → billy_vecna 3
    ]
  },

  /* 살펴볼 수 있는 오브제. collect:true 인 것만 인벤토리에 들어갑니다 */
  items: {
    board: {
      title: '맥스의 스케이트 보드', img: 'it_board.webp', x: 677, y: 293,
      desc: ['맥스가 항상 외출할 때마다 타고 다니는 애착 보드다', '보드없이 밖을 나간 적이 없는데 말이지...'],
      collect: true, slot: 1, slotImg: 'slot_board.png', card: 'item_board.webp', mini: { img: 'mini_board.png', x: 118, y: 212 }
    },
    walkman: {
      title: '맥스의 워크맨', img: 'it_walkman.webp', x: 701, y: 248,
      desc: ['맥스가 늘 곁에 두고 다니는 워크맨.  음악은 맥스에게 위로의 물건 중 하나다', '언제나 음악과 함께한 그녀의 흔적이 남아 있다.'],
      invDesc: ['맥스가 늘 곁에 두고 다니는 워크맨.', '음악은 맥스에게 위로의 물건 중 하나다', '언제나 음악과 함께한 그녀의 흔적이 남아 있다.'],
      collect: true, slot: 0, slotImg: 'slot_walkman.png', card: 'item_walkman.webp', mini: { img: 'mini_walkman.png', x: 245, y: 210 }
    },
    idcard: {
      title: '홉킨스 실험실의 ID 카드', img: 'it_idcard.webp', x: 789, y: 190,
      desc: ['홉킨스 실험실 직원용 ID카드다.'], descTop: 905,
      collect: true, slot: 2, slotImg: 'slot_idcard.png', card: 'item_idcard.webp', mini: { img: 'mini_idcard.png', x: 367, y: 196 }
    },
    train:     { title: '장난감 기차', img: 'it_train.webp', x: 418, y: 292, desc: [] },
    newspaper: { title: '실험실의 신문지', img: 'it_newspaper.webp', x: 745, y: 262, desc: ['붉은색으로 크게 숫자가 쓰여있다', '어떤 걸 의미하는걸까'] }
  },

  /* 제어실 판넬 */
  panel: {
    title: '제어실 판넬', desc: ['네 자리 숫자를 입력해야 한다.', '비밀번호가 뭘까?'],
    answer: '2134',
    /* 피그마 Scene #4_puzzle_button 의 button 프레임(952×536) 안 좌표 */
    keys:   [{ img: 'pn_btn1.png', x: 409, y: 247 }, { img: 'pn_btn2.png', x: 411, y: 297 }, { img: 'pn_btn3.png', x: 412, y: 347 }, { img: 'pn_btn4.png', x: 413, y: 395 }],   // button_1~4
    lamps:  [{ img: 'pn_light1.png', x: 543, y: 220 }, { img: 'pn_light2.png', x: 543, y: 283 }, { img: 'pn_light3.png', x: 543, y: 344 }, { img: 'pn_light4.png', x: 543, y: 406 }], // #1~4 light (항상 보임)
    beams:  [{ img: 'pn_beam1.png', glow: '#ff8a1e', x: 562, y: 242 }, { img: 'pn_beam2.png', glow: '#2bff7a', x: 562, y: 306 }, { img: 'pn_beam3.png', glow: '#ff8a1e', x: 562, y: 366 }, { img: 'pn_beam4.png', glow: '#2bff7a', x: 562, y: 429 }],   // #1~4 beam (opacity 0 → 100), glow = 빛 번짐 색
    wrongHold: 350,   // 틀린 네 자리: 마지막 beam 이 켜진 뒤 4개가 꺼지기까지의 시간(ms)
    blink: { count: 5, period: 280 }   // 2134 정답: 4개 beam 이 동시에 깜박이는 횟수 / 한 번의 길이(ms)
  },

  text: {
    kitchen: '미처 치우지 못한 아침 식사 자리다. 급하게 다들 어디로 사라진걸까?',
    boxEmpty: '텅 비어있어...',
    invHint: ['인벤토리에서 아이템을 클릭하세요', '디테일한 정보를 얻을 수 있습니다'],
    tv: 'TV에 녹화된 보난자가 틀어져 있다',
    skip: '영상 스킵하기',
    timeOver: '시간 초과! 다시 시도하세요',
    doorLocked: '잠겼어',
    doorOpened: '어딘가에서 문이 열리는 소리가 들린다',
    needCard: '직원용 ID 카드가 필요해',
    ending: '지하 실험실 깊숙한 곳에 도착하자, 맥스가 공중에 떠있는 모습이 보인다',
    ending_1: '그녀의 의식은 이미 뒤집힌 세계 너머로 끌려간 듯하다',
    ending_2: '맥스를 현실로 되돌리기 위해, 어떤 도구를 사용해야 할까?'
  },

  /* 엔딩 화면: img = assets/img 파일, x·y·w·h = 피그마 프레임 안 이미지 자리, text = 아래 문구 */
  endings: {
    ending:   { img: 'ending.jpg',   x: 241, y: 124, w: 1439, h: 784 },
    ending_1: { img: 'ending_1.jpg', x: 240, y: 124, w: 1439, h: 784 },
    ending_2: { img: 'ending_2.jpg', x: 320, y: 72,  w: 1280, h: 697 },
    /* 워크맨을 고르면: true ending_1 → 2 → 3 → true ending_result → intro */
    trueEnding: [
      { img: 'true_1.jpg', x: 240, y: 72,  w: 1448, h: 836, text: '더스틴의 말에 루카스는 급히 실험실 디스크로 워크맨 속 노래를 크게 틀었다' },
      { img: 'true_2.jpg', x: 241, y: 124, w: 1439, h: 784, text: '일레븐은 마지막 힘으로 빌리를 밀어냈고, 뒤로 물러서던 빌리는 결국 포탈 속으로 추락했다' },
      { img: 'true_3.jpg', x: 427, y: 280, w: 1067, h: 582, text: '동시에 공중에 떠있던 맥스가 바닥으로 떨어졌고, 친구들은 서둘러 그녀를 받아냈다' }
    ],
    trueResult: 'result.jpg',
    /* 스케이트 보드를 고르면: bad ending_1 → 2 → 3 → bad ending 결과 화면 → intro */
    badEnding: [
      { img: 'bad_1.jpg', x: 240, y: 72,  w: 1448, h: 836, text: '스케이트보드를 외치며 맥스를 깨우려 하지만, 맥스는 아무런 반응을 보이지 않는다' },
      { img: 'bad_2.jpg', x: 429, y: 124, w: 1064, h: 784, text: '맥스의 몸은 점점 더 높이 떠오르고, 빌리의 모습을 한 마인드 플레이어가 모습을 드러낸다' },
      { img: 'bad_3.jpg', x: 439, y: 299, w: 1042, h: 521, text: '끝내 맥스는 고통 속에 바닥으로 추락하고, 결국 친구들은 그녀를 구하지 못한다' }
    ],
    badResult: 'result_bad.jpg'
  }
};
