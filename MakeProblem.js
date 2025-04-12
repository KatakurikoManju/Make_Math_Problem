async function generateQuestion() {
  const apiKey = document.getElementById('apiKey').value.trim();
  if (!apiKey) return alert('APIキーを入力してほしいのだ！');

  const generateBtn = document.getElementById('generateButton');
  generateBtn.disabled = true;
  const originalGenText = generateBtn.textContent;
  generateBtn.textContent = "生成中・・・";

  // 状況表示：生成中（ボタン自体で表示するので他の場所はクリア）
  document.getElementById('questionText').textContent = "";
  document.getElementById('questionBox').style.display = 'block';
  document.getElementById('result').textContent = "";

  const selectedModel = document.getElementById('modelChoice').value;
  const grade = document.getElementById('grade').value;
  const difficulty = document.getElementById('difficulty').value;
  const topic = document.getElementById('topic').value.trim();
  const type = document.getElementById('type').value;

  const prompt = `あなたは日本の学校教育に詳しい数学教師なのだ。
次の条件に従い、1問だけ数学の問題を出題するのだ。ただし、答えや解説は含めず、問題文のみを作成するのだ。
- 学年: ${grade}
- 学年内の難易度: ${difficulty}
- 分野: ${topic}
- 問題タイプ: ${type}
- 問題文は日本語で作成し、数式がある場合は $$...$$ でディスプレイ数式として記述するのだ。`;

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + apiKey,
      },
      body: JSON.stringify({
        model: selectedModel,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    
    const data = await res.json();

    if (data.error || !data.choices || data.choices.length === 0) {
      throw new Error(data.error?.message || "APIから有効なデータが返されなかったのだ");
    }

    const questionText = data.choices[0].message.content.trim();
    document.getElementById('questionText').innerHTML = questionText;
    document.getElementById('result').textContent = "";
    document.getElementById('userAnswer').value = '';
    MathJax.startup.promise.then(() => MathJax.typesetPromise());
  } catch (err) {
    console.error(err);
    document.getElementById('questionText').textContent = "";
    document.getElementById('result').textContent = "";
    alert('問題の生成に失敗したのだ… ' + err.message);
  } finally {
    generateBtn.disabled = false;
    generateBtn.textContent = originalGenText;
  }
}

async function checkAnswer() {
  const apiKey = document.getElementById('apiKey').value.trim();
  if (!apiKey) return alert('APIキーを入力してほしいのだ！');

  const checkBtn = document.getElementById('checkAnswerButton');
  checkBtn.disabled = true;
  const originalCheckText = checkBtn.textContent;
  checkBtn.textContent = "採点中・・・";

  const selectedModel = document.getElementById('modelChoice').value;
  const userAnswer = document.getElementById('userAnswer').value.trim().replace(/[。\\n]/g, '');
  if (!userAnswer) {
    checkBtn.disabled = false;
    checkBtn.textContent = originalCheckText;
    return alert("答えを入力してほしいのだ！");
  }

  document.getElementById('result').innerHTML = "";

  const prompt = `あなたは数学の問題を採点する名人なのだ。
以下の問題に対して、ユーザーの解答が正しいかどうかを判定するのだ。
もし解説がなくても、答えそのものが正しければ「正解」と判断するのだ。

出力フォーマットの例：
正解
理由：
$$
＜説明・計算過程（あってもよい）＞
$$

または

不正解
理由：
$$
＜説明・計算過程＞
$$

---
問題文: ${document.getElementById('questionText').textContent}
ユーザーの解答: ${userAnswer}
---`;
  
  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + apiKey,
      },
      body: JSON.stringify({
        model: selectedModel,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    const data = await res.json();

    if (data.error || !data.choices || data.choices.length === 0) {
      throw new Error(data.error?.message || "採点APIが応答しなかったのだ");
    }

    let evaluation = data.choices[0].message.content.trim();
    const lines = evaluation.split('\n').map(line => line.trim()).filter(line => line);
    if (lines.length > 1) {
      const verdict = lines[0];
      let explanation = lines.slice(1).join('\n');
      if (!explanation.includes('$$')) {
        explanation = '$$' + explanation + '$$';
      }
      evaluation = `<p>${verdict}</p><div style="text-align:center;">${explanation}</div>`;
    }
    document.getElementById('result').innerHTML = evaluation;
    MathJax.startup.promise.then(() => MathJax.typesetPromise());
  } catch (err) {
    console.error(err);
    document.getElementById('result').textContent = "";
    alert('採点に失敗したのだ… ' + err.message);
  } finally {
    checkBtn.disabled = false;
    checkBtn.textContent = originalCheckText;
  }
}