# 마음 톡톡 🌱 - 초등학교 6학년을 위한 AI 마음 건강 도우미

초등학교 6학년 학생들의 마음 건강을 돕기 위해 제작된 따뜻하고 친근한 대화형 웹 서비스입니다.

---

## 🌟 프로젝트 소개
정신건강에 대한 기초지식이 부족한 초등학교 6학년 학생을 대상으로 하며, 다정한 형이나 누나처럼 따뜻하게 공감하고 이야기하는 AI 도우미 서비스입니다.

- **AI 도우미 역할**: 실제 사람이나 의사가 아닌 AI 챗봇임을 명시하고 안심할 수 있는 대화 분위기 형성
- **3단계 대화 흐름**: ① 공감하기 → ② 쉽게 설명하기 → ③ 도움 요청 안내하기
- **안전 최우선**: 임의 진단 금지, 임의 약물 복용 금지, 위험 신호(자해/자살/위기) 감지 시 안전 안내 및 119/1388 긴급 연락망 안내
- **다양한 AI 엔진 지원**: 
  - **OpenAI GPT API (`gpt-4o-mini`, `gpt-4o`)** 환경변수 연동
  - **Google Gemini API** 연동
  - API 키 없이도 즉시 작동하는 **자체 내장 상담 규칙 엔진**

---

## 🔑 API 키 및 환경 변수 설정

### 방법 1. 환경 변수로 설정 (권장)
운영체제 환경 변수에 `OPENAI_API_KEY`를 설정하면 서버가 자동으로 감지하여 최신 GPT 모델로 상담을 진행합니다.

- **Windows PowerShell**:
  ```powershell
  $env:OPENAI_API_KEY = "sk-..."
  node server.js
  ```
- **Windows CMD**:
  ```cmd
  set OPENAI_API_KEY=sk-...
  node server.js
  ```
- **macOS / Linux**:
  ```bash
  export OPENAI_API_KEY="sk-..."
  node server.js
  ```

### 방법 2. `.env` 파일 사용
프로젝트 루트 경로에 `.env` 파일을 생성하고 키를 입력합니다 (`.gitignore`에 등록되어 안전합니다):
```env
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini
```

### 방법 3. 브라우저 설정창 입력
웹 브라우저 우측 상단의 ⚙️ 설정 버튼을 눌러 직접 API 키를 입력할 수도 있습니다.

---

## 🚀 실행 방법

### 요구 사항
- [Node.js](https://nodejs.org/) v18 이상

### 로컬 실행
별도의 무거운 패키지 설치 없이 Node.js 내장 모듈만으로 가볍고 빠르게 동작합니다.

```bash
# 프로젝트 폴더로 이동
cd mind-helper-chat

# 서버 실행
node server.js
```

브라우저에서 `http://localhost:3000`으로 접속하여 테스트할 수 있습니다.

---

## 📁 디렉터리 구조
```
mind-helper-chat/
├── public/
│   ├── index.html       # 웹 챗봇 화면 UI
│   ├── style.css        # 따뜻한 파스텔톤 스타일 시트
│   └── app.js           # 프론트엔드 채팅 로직 & 이벤트 핸들러
├── server.js            # Node.js HTTP 서버 및 GPT/상담 엔진
├── .env.example         # 환경 변수 예시 파일
├── .gitignore           # 민감 정보(.env 등) 제외 설정
└── README.md
```
