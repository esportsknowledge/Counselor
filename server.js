const http = require('http');
const fs = require('fs');
const path = require('path');
const https = require('https');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');

// MIME types for static files
const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.js': 'application/javascript; charset=UTF-8',
  '.json': 'application/json; charset=UTF-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

// System prompt definition
const SYSTEM_PROMPT = `
너는 초등학교 6학년 학생을 위한 AI 마음 건강 도우미야.
정신건강에 대한 기초지식이 거의 없는 초등학교 6학년 학생을 대상으로 하며, 다정한 형이나 누나처럼 친근하고 따뜻하게 대화해.
단, 너는 실제 사람이 아닌 AI 챗봇이며, 의사나 전문 상담사가 아니야. 학생에게 실제 사람이나 의료 전문가인 것처럼 행동해서는 안 돼.

목적:
1. 자신의 감정과 경험 표현하기
2. 정신건강에 관한 기본적인 정보 이해하기
3. 적절한 도움 요청하기

진행 규칙:
1. 다정한 형이나 누나처럼 따뜻한 반말 사용.
2. 일반적인 답변은 5~7문장 정도로 작성.
3. 쉬운 표현 사용, 전문 의학 용어 피하기.
4. 순서: ① 공감하기 -> ② 쉽게 설명하기 -> ③ 도움 요청 안내하기 (질문은 한 번에 하나씩).
5. 절대 금지:
   - 특정 정신질환(공황장애, 우울증 등)을 진단/단정하지 않기.
   - 약물 복용이나 치료 방법을 임의로 지시하지 않기.
   - 위험 신호(자해, 자살, 극심한 위기)를 무시하거나 비밀로 하지 않기 (안전 최우선, 즉각 위험 확인, 보호자/119 안내).
`;

// Rule-based fallback conversational AI engine
function generateLocalResponse(message, history) {
  const text = message.trim();
  const lower = text.toLowerCase();

  // 1. Extreme danger signals: Self-harm, suicide, disappear, death
  if (/죽고\s*싶|사라지고\s*싶|자해|자살|끝내고\s*싶|살기\s*싫|다치게/.test(text)) {
    return [
      "정말 많이 힘들고 버거웠구나. 그런 마음을 용기 내어 나한테 털어놓아 줘서 정말 고마워.",
      "네가 사라지고 싶다고 말해서 형/누나는 네 안전이 많이 걱정돼.",
      "혹시 지금 당장 스스로를 다치게 하고 싶은 마음이나 위험한 상황에 놓여 있니?",
      "이런 아프고 힘든 마음은 너 혼자 짊어지거나 비밀로 할 일이 절대 아니야.",
      "지금 바로 곁에 있는 부모님이나 선생님께 꼭 이야기하고, 함께 있어 달라고 부탁해 줘.",
      "만약 지금 당장 위험하거나 주변에 말할 어른이 없다면 망설이지 말고 119나 청소년 전화 1388에 바로 연락해야 해."
    ].join('\n');
  }

  // 2. Medication / drugs question
  if (/약\s*먹|약\s*먹어도|수면제|신경안정제|집에\s*있는\s*약|타이레놀|감기약/.test(text)) {
    return [
      "불안하고 힘든 마음을 빨리 가라앉히고 싶어서 약 생각이 먼저 났구나.",
      "마음이 너무 괴로우면 당장 약이라도 먹어서 편해지고 싶은 그 심정 충분히 이해해.",
      "하지만 병원에서 정확히 너를 위해 처방해 준 약이 아니거나, 집에 있는 다른 약을 임의로 먹는 건 몸에 무척 위험할 수 있어.",
      "약은 사람마다 몸무게나 증상에 따라 안전한 종류와 양이 다 다르거든.",
      "약이 필요할 만큼 힘들다면 혼자 고민하지 말고 부모님께 말씀드려 병원에 함께 가보는 게 좋아.",
      "'엄마, 요즘 마음이 너무 불안해서 병원 상담이나 약의 도움을 받고 싶어요'라고 부모님께 말씀드려 볼래?"
    ].join('\n');
  }

  // 3. Panic symptoms / heart pounding / breathing issues
  if (/공황|심장|숨이\s*막|숨\s*쉬기|가슴이\s*답답|두근|어지러|죽을\s*것\s*같/.test(text)) {
    return [
      "갑자기 심장이 마구 뛰고 숨이 턱 막히면 정말 무섭고 당황스러웠을 거야.",
      "많이 놀랐을 텐데 이렇게 어떤 느낌인지 차분하게 이야기해 줘서 참 대견해.",
      "가슴이 두근거리거나 숨쉬기 힘든 느낌은 큰 스트레스나 불안을 겪을 때 몸이 보내는 신호일 수도 있지만, 다른 신체적인 이유 때문일 수도 있어.",
      "그래서 지금 겪은 증상만 가지고 공황장애라고 단정하거나 스스로 진단할 수는 없단다.",
      "우선 천천히 숨을 깊게 들이마시고 내쉬면서 마음을 가라앉혀 보고, 이런 증상이 자주 반복된다면 꼭 부모님께 말씀드려 소아청소년과나 전문 선생님을 찾아가는 게 좋아.",
      "혹시 이런 느낌이 시험을 볼 때처럼 특정한 상황에서 생겼는지, 아니면 갑자기 아무 이유 없이 찾아왔는지 말해 줄래?"
    ].join('\n');
  }

  // 4. Depression / helplessness / sadness / crying
  if (/우울|눈물|울고\s*싶|기운이\s*없|무기력|아무것도\s*하기\s*싫|슬퍼/.test(text)) {
    return [
      "마음이 무겁고 아무것도 손에 잡히지 않아서 참 답답하고 지쳤겠구나.",
      "그런 우울하고 슬픈 감정을 꾹 참지 않고 나한테 이야기해 줘서 고마워.",
      "누구나 마음의 에너지가 다 떨어지면 감기처럼 우울한 마음이 찾아올 수 있어.",
      "하지만 이런 힘든 기분이 며칠 동안 계속 이어진다면 혼자 견디려 하지 말고 주변에 손을 내미는 게 필요해.",
      "학교에 계신 위클래스 상담 선생님이나 담임 선생님, 혹은 부모님께 요즘 마음이 많이 가라앉는다고 털어놓아 보는 건 어떨까?",
      "어떤 일 때문에 마음이 이렇게 무거워졌는지 천천히 하나씩 이야기해 줄래?"
    ].join('\n');
  }

  // 5. Test / study / academy stress
  if (/시험|성적|공부|학원|숙제|점수/.test(text)) {
    return [
      "공부랑 시험 때문에 부담감도 크고 스트레스를 정말 많이 받았구나.",
      "잘하고 싶은 마음이 큰 만큼 걱정도 앞서고 가슴이 답답했을 거야.",
      "초등학교 6학년이면 중학교 준비도 겹쳐서 학업 때문에 긴장하고 불안해지는 친구들이 참 많단다.",
      "그럴 때는 잠시 책을 덮고 좋아하는 음악을 듣거나 산책을 하며 마음에 쉼표를 찍어주는 것도 큰 도움이 돼.",
      "만약 학원이나 공부 양이 너무 버겁다면 '엄마, 요즘 숙제랑 시험 때문에 너무 부담돼서 마음이 힘들어요'라고 솔직히 부모님과 상의해 보는 게 좋아.",
      "혹시 이번 시험이나 공부 중에서 가장 크게 걱정되는 부분이 무엇인지 말해 줄래?"
    ].join('\n');
  }

  // 6. Friends / peer relationships / bullying / loneliness
  if (/친구|외로|따돌림|싸웠|놀림|단짝|어울리/.test(text)) {
    return [
      "친구 사이에서 마음고생을 하느라 많이 속상하고 외로웠겠구나.",
      "학교생활에서 친구는 정말 소중한 부분이라, 거기서 오는 고민은 어른들이 생각하는 것보다 훨씬 아프게 느껴질 수 있어.",
      "너의 잘못이 아닌 일로 상처받거나 괴로워하고 있다면 혼자 속으로만 끙끙 앓지 않았으면 좋겠어.",
      "이런 일은 믿을 수 있는 담임 선생님이나 학교 상담실(위클래스) 선생님께 꼭 말씀드려 도움을 받는 것이 안전하단다.",
      "'선생님, 친구 관계 때문에 마음에 큰 고민이 있어서 상담하고 싶어요'라고 용기를 내보는 건 어떨까?",
      "친구들과 어떤 일이 있었는지 조금 더 자세히 이야기해 줄 수 있니?"
    ].join('\n');
  }

  // 7. How to tell parents or adults
  if (/말하기\s*무서|부모님|어떻게\s*말|혼날까봐|도움/.test(text)) {
    return [
      "어른들에게 마음속 이야기를 꺼내려니 혼날까 봐 걱정되고 많이 망설여졌구나.",
      "용기를 내고 싶지만 입이 쉽게 떨어지지 않는 그 두려운 마음, 정말 이해해.",
      "하지만 부모님이나 선생님도 네가 아프고 힘든 걸 알면 누구보다 너를 돕고 싶어 하실 거야.",
      "직접 말하기 떨린다면 포스트잇이나 카카오톡 메시지로 '요즘 마음이 많이 힘들어서 이야기 나누고 싶어요'라고 짧게 남겨보는 것도 좋은 방법이야.",
      "작은 신호라도 먼저 보내면 어른들이 네 마음을 들을 준비를 차근차근 도와주실 수 있단다.",
      "부모님 중에서 혹은 학교 선생님 중에서 네 이야기를 가장 편하게 들어줄 것 같은 분은 누구니?"
    ].join('\n');
  }

  // 8. General / Daily / Default response
  return [
    "네가 들려준 이야기를 차분히 귀 기울여 읽어보았어.",
    "속에 담아두었던 생각을 이렇게 솔직하게 표현해 줘서 참 고맙고 멋져.",
    "누구나 자라면서 때로는 알 수 없는 불안이나 답답한 감정을 만나곤 해.",
    "그럴 때 자신의 감정을 구체적으로 들여다보고 말로 표현하는 것만으로도 마음이 한결 가벼워질 수 있단다.",
    "혹시 오늘 있었던 일 중에서 마음에 가장 걸리거나 네 머릿속을 맴도는 생각이 무엇인지 편하게 들려줄래?",
    "언제나 형/누나처럼 여기서 네 이야기를 들을 준비가 되어 있으니까 천천히 말해 줘."
  ].join('\n');
}

// Call Google Gemini API if user configured key
async function callGeminiAPI(apiKey, message, history) {
  return new Promise((resolve, reject) => {
    const contents = [];
    
    // Convert history
    if (Array.isArray(history)) {
      for (const item of history) {
        contents.push({
          role: item.role === 'user' ? 'user' : 'model',
          parts: [{ text: item.text }]
        });
      }
    }
    
    contents.push({
      role: 'user',
      parts: [{ text: message }]
    });

    const payload = JSON.stringify({
      systemInstruction: {
        parts: [{ text: SYSTEM_PROMPT }]
      },
      contents: contents,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 600
      }
    });

    const url = new URL(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`);

    const req = https.request(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          if (parsed.candidates && parsed.candidates[0] && parsed.candidates[0].content) {
            resolve(parsed.candidates[0].content.parts.map(p => p.text).join(' '));
          } else if (parsed.error) {
            reject(new Error(parsed.error.message || 'Gemini API Error'));
          } else {
            reject(new Error('Invalid Gemini API response structure'));
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

// HTTP Server
const server = http.createServer(async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;

  // API endpoint
  if (req.method === 'POST' && pathname === '/api/chat') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const data = JSON.parse(body);
        const userMsg = data.message || '';
        const history = data.history || [];
        const apiKey = data.apiKey ? data.apiKey.trim() : '';

        let reply = '';
        let source = 'local';

        if (apiKey) {
          try {
            reply = await callGeminiAPI(apiKey, userMsg, history);
            source = 'gemini';
          } catch (err) {
            console.error('Gemini API call failed, falling back to local engine:', err.message);
            reply = generateLocalResponse(userMsg, history);
            source = 'local_fallback';
          }
        } else {
          reply = generateLocalResponse(userMsg, history);
        }

        res.writeHead(200, { 'Content-Type': 'application/json; charset=UTF-8' });
        res.end(JSON.stringify({ reply, source }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=UTF-8' });
        res.end(JSON.stringify({ error: '잘못된 요청 형식입니다.' }));
      }
    });
    return;
  }

  // Static file serving
  let reqPath = pathname === '/' ? '/index.html' : pathname;
  let filePath = path.join(PUBLIC_DIR, reqPath);

  // Security check: stay within PUBLIC_DIR
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=UTF-8' });
    res.end('Forbidden');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=UTF-8' });
      res.end('404 Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`=================================================`);
  console.log(`🌱 초등학교 6학년을 위한 AI 마음 건강 도우미 웹 서버`);
  console.log(`👉 로컬 주소(Localhost): http://localhost:${PORT}`);
  console.log(`=================================================`);
});
