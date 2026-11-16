# The Signal — 퍼즐게임 (intro ~ true ending 첫 화면)

`index.html`을 브라우저에서 열면 바로 실행됩니다. (1920×1080 기준, 창 크기에 맞춰 자동 축소)

## 폴더
- `index.html` / `css/game.css` / `js/game.js`(엔진) / `js/data.js`(대사·좌표·시간 설정)
- `assets/img/` 피그마에서 받아 온 이미지
- `assets/video/` **영상 파일을 넣는 자리** (현재 비어 있음)
- `assets/fonts/` **폰트 파일을 넣는 자리** (현재 비어 있음)

## 영상 넣기
아래 이름 그대로 `assets/video/`에 넣으면 연결됩니다. 이름을 바꾸려면 `js/data.js`의 `video` 항목을 수정하세요.

| 파일 | 쓰이는 곳 |
|---|---|
| intro.mp4 | intro 배경 (반복 재생, 음소거) |
| chapter_1.mp4 / chapter_2.mp4 / chapter_3.mp4 / chapter_4.mp4 | 각 챕터 영상 |
| intro_animation.mp4 | chapter_1 다음 영상 |
| billy.mp4 | Scene #1_billy_video |
| max_scream.mp4 | Scene #2_max_scream |

파일이 없으면 그 자리는 첫 프레임 이미지(또는 검은 화면)만 잠깐 보이고 다음 씬으로 넘어갑니다.

## 폰트 넣기
컴퓨터에 설치된 폰트를 먼저 사용합니다. 전시용 기기처럼 폰트가 없는 곳에서는 아래 파일을 `assets/fonts/`에 넣어주세요.
- DNFForgedBlade-Light.otf / DNFForgedBlade-Medium.otf / DNFForgedBlade-Bold.otf
- BenguiatStd-Bold.otf (미니게임 카운트 숫자)

## 테스트용 바로가기
주소 뒤에 씬 이름을 붙이면 그 씬부터 시작합니다. 예: `index.html#house`
`scene1` `billy` `minigame` `scene2` `scene3` `house` `scene4` `lab` `ending` `ending_2` `true_ending_1` `true_ending_result`

## 아직 비워 둔 자리
- true ending_1 ~ 3 이미지 → `js/data.js` 의 `trueEndingImages` 에 파일 이름을 넣으면 표시됩니다
- 설정 창 / OPTIONS 의 배경음악·효과음 슬라이더 (소리가 아직 없어 모양만 있습니다. 밝기만 동작)

## 진행 규칙 메모
- 집(Scene #3 퍼즐)에서 보드·워크맨·ID 카드 3개를 모두 얻으면 chapter_4 로 넘어갑니다. (임시 규칙 — `js/game.js`의 `showItem` 안)
- 시간(유지 시간, fade 시작 시점)은 `js/data.js`의 `timing`, fade 길이는 `css/game.css`의 `--fade`에서 바꿉니다.

## 11/15 점검 내용
- intro → true ending 까지 전체 흐름을 브라우저에서 끝까지 플레이해 확인했습니다. (영상은 테스트용 클립으로 fade in/out·반복 재생 확인)
- 인벤토리 닫기 버튼에 X 아이콘이 두 개 겹쳐 보이던 것 수정
- 인벤토리 슬롯 테두리를 피그마 두께에 맞춤
- 미니게임 마우스 커서가 opacity 0 ↔ 100 을 부드럽게 오가도록 수정
- 퍼즐 씬을 떠난 뒤에도 이전 방이 보이지 않게 남아 있던 문제 수정

## 11/15 2차 수정
- intro animation: 오른쪽 위 '영상 스킵하기'를 누르면 영상이 fade out 되며 다음 씬으로 넘어갑니다.
- 미니게임: gauge 가 20초 타이머로 동작합니다. (`js/data.js` → `minigame.time`)
  시간이 다 되면 '시간 초과! 다시 시도하세요' 문구 뒤 처음부터 다시 시작합니다.
- 미니게임: 클릭 유도 영상 자리 추가. 보내주신 PNG 시퀀스(27프레임, 25fps)를 `assets/video/click.mp4` 로 변환해 넣었습니다. 검은 배경은 screen 블렌드로 투명하게 보입니다.
  (크기는 `minigame.clickSize`, 파일 이름은 `minigame.clickVideo`)
- Scene #2_max_scream 에서 멈추던 오류 수정: 영상 길이가 약 1.7초 이하이면 화면 전환이 끝나기 전에
  '다음 씬' 신호가 먼저 와서 무시되던 문제였습니다. 3초 이하의 짧은 영상은 끝까지 재생한 뒤 fade out 합니다.
  또 영상이 6초 이상 멈춰 있으면(코덱·로딩 문제) 자동으로 다음 씬으로 넘어갑니다.

## 11/16 수정 (피그마 변경 반영)
- intro → CREDITS: 크레딧이 20초 동안 위로 올라갑니다 (`timing.creditRoll`). 뒤로 버튼 → intro
- intro → CHAPTERS: 사진 4장이 빨랫줄에 걸린 것처럼 흔들리며 왼쪽에서 들어옵니다. 호버·화살표로 챕터 변경, 사진이나 글자를 누르면 해당 chapter 로 이동
  (챕터 이름·제목은 `js/data.js` 의 `chapters`)
- 설정 버튼 → 설정 창이 아래에서 올라옵니다. 열려 있는 동안 타이머·영상이 멈춥니다
  - 밝기 5단계 (`brightness`), OPTIONS 화면의 밝기와 연동, 브라우저에 저장됨
  - CHAPTERS / CREDITS → 뒤로 버튼을 누르면 진행 중이던 화면으로 돌아옵니다
- 미니게임: 마우스 cursor 레이어만 깜박임, 겹친 원 두 개가 시간 차로 커지는 클릭 유도, 시간 초과 → 실패 화면 → intro
- Scene #1_billy_1: 충격 효과 (상하좌우 흔들림 + 잔상, 점점 약해짐)
- 집: front door_2 / kitchen_1 / living room_2(TV) 하단 문구가 fade in → fade out
- 아이템·신문지·판넬 화면은 클릭 대신 일정 시간 뒤 자동으로 닫힙니다 (`itemHold`, 판넬은 마지막 입력 뒤 `panelIdle`)
- 제어실 판넬: 누른 버튼이 90%로 눌리고 같은 번호의 beam 이 켜짐, 틀린 번호는 즉시 모두 꺼짐, 2134 → 4개 동시 깜박임 + 문구
- 신문지를 화면 정중앙으로
- 인벤토리: 슬롯 클릭 → item_walkman / item_board / item_idcard 가 아래에서 올라옴, 설정 탭 → OPTIONS (책이 통째로 내려갔다 올라옴), 닫기는 열릴 때의 역순
- ending → ending_1 → ending_2(10초 선택) → 워크맨 → true ending_1 → 2 → 3 → result → intro
  - 스케이트 보드를 고르거나 시간이 다 되면 아직 다른 엔딩 화면이 없어 타이머가 다시 시작됩니다
- 거실 배경을 피그마의 새 렌더로 교체
- 크레딧 본문은 Pretendard (인터넷 연결 시 자동으로 불러옴)

## 11/16 2차 수정
- '영상 스킵하기' 밑줄 제거
- OPTIONS 의 가방 탭(button_1)을 피그마처럼 좌우 반전된 모양·위치(x 1585~1694)로 수정
- 아이템·신문지 화면 자동 닫힘 3.8초 → 2.6초, 제어실 판넬은 마지막 입력 뒤 9초 → 7초 (`itemHold`, `panelIdle`)
- Scene #4_puzzle_hall: 피그마에서 빠진 Search_wash 돋보기 제거 (Search_door 만 남김)
- 인벤토리 첫 화면: 오른쪽 종이에 '인벤토리에서 아이템을 클릭하세요 / 디테일한 정보를 얻을 수 있습니다' 안내 (`text.invHint`).
  슬롯을 누르면 이 종이가 내려가고 item_walkman / item_board / item_idcard 가 아래에서 올라옵니다
- 제어실 판넬: 누르는 동안·누른 직후 버튼이 90% 로 줄어드는 모습을 더 잘 보이게 조정
- 엔딩 화면 유지 시간 단축: ending·ending_1·true ending_1~3 4.5초 → 3.2초, result 5초 → 4초

## 11/16 3차 수정 (피그마 변경 반영)
- OPTIONS: Group 225 / 226 / 227 사진을 피그마에서 다시 받아 넣고, 종이에 비쳐 투명하게 보이던 원인(multiply 블렌드)을 제거
- 제어실 판넬(Scene #4_puzzle_button)을 피그마 레이어 구조대로 다시 구성
  - button_1~4 실제 버튼 이미지가 눌릴 때 90% 로 작아짐 (기존 흰 원 제거, 구멍 위치에 정확히 맞춤)
  - #1~4 light(항상 보임) 위에 #1~4 beam 이 opacity 0 → 100, 틀린 번호는 transition 없이 바로 0
  - 2134 → beam 4개 동시 깜박임 → '어디선가 문이 열리는 소리가 들린다' (깜박임 횟수·속도는 `js/data.js` → `panel.blink`)
- 미니게임 mouse: cursor 레이어만 opacity 0 ↔ 100 으로 깜박임 (동작 확인, 속도는 `css/game.css` 의 `.mouse .cursor`)
- Scene #1_night '그 날 저녁, 폐건물 근처' / Scene #2_overnight '그 날 새벽, 맥스의 집' 으로 새 레이아웃 적용

## 11/16 4차 수정
- 제어실 판넬: 켜진 beam 에 빛 번짐(glow) 추가 — 주황(#1, #3) / 초록(#2, #4)
  - 번짐 색은 `js/data.js` → `panel.beams` 의 `glow`, 세기는 `css/game.css` 의 `.panel .light` (brightness, drop-shadow 값)

## 11/16 5차 수정
- 제어실 판넬 판정 방식 변경: 버튼을 누르면 맞든 틀리든 해당 번호의 beam 이 켜지고, 네 자리를 다 눌렀을 때 판정
  - 2134 → 4개 beam 동시 깜박임 + 문구 / 그 외 → 4개 beam 이 바로 0 (꺼지기 전 대기 시간은 `js/data.js` → `panel.wrongHold`)

## 11/16 6차 수정 (엔딩 분기)
- ending / ending_1 / ending_2, true ending_1~3 일러스트를 피그마의 새 이미지로 교체 (화면마다 다른 크기·위치 반영)
- ending_2 선택에 따라 분기 (전환 애니메이션은 두 갈래 모두 동일)
  - 워크맨 → true ending_1 → 2 → 3 → TRUE ENDING 결과 화면 → intro
  - 스케이트 보드 → bad ending_1 → 2 → 3 → BAD ENDING 결과 화면 → intro
  - 10초 안에 고르지 않으면 bad ending 으로 넘어갑니다 (시간은 `js/data.js` → `choiceTime`)
- 엔딩 이미지·문구·위치는 `js/data.js` → `endings` 에서 수정
- 테스트: 주소 뒤에 `#ending_2`, `#bad_ending_1`, `#true_ending_1` 등을 붙이면 그 화면부터 시작

## 11/16 7차 수정 (사운드)
- 음원은 `assets/audio/`, 설정은 `js/data.js` → `audio` (음원별 크기 `gain`, fade 시간, 어느 씬에서 들릴지)
- 배경음악
  - game_main_sound_2: 모든 페이지에서 반복 재생 (효과음보다 약간 작게)
  - game_main_sound_1: 제어실(Scene #4 puzzle) ~ 엔딩에서 main 2 와 함께, 더 작게. intro 로 돌아갈 때 4초 동안 천천히 사라짐
  - intro animation / chapter_1~4 / Scene #2_max_scream 에서는 두 배경음악 모두 꺼짐
- 효과음
  - intro_animation.mp3 / chapter_sound.mp3 / max_scream.mp3: 해당 영상이 재생될 때 함께 (intro animation 영상 자체의 소리는 끔)
  - car_sound.mp3: Scene #1_billy_1 화면이 흔들릴 때
  - tangle_sound.mp3: 미니게임에서 billy_vecna 가 한 장 사라질 때마다
- 설정 창 / OPTIONS 의 배경음악·효과음 슬라이더가 실제로 동작 (배경음악 = main sound 1·2, 효과음 = 나머지 전부)
- 브라우저 정책상 첫 화면에서는 한 번 클릭한 뒤부터 소리가 납니다
