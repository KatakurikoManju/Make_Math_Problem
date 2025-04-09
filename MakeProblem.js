let correctAnswer = "";
// 問題生成関数
async function generateQuestion() {
  const apiKey = document.getElementById('apiKey').value.trim();
  if (!apiKey) return alert('APIキーを入力してほしいのだ！');
  const grade = document.getElementById('grade').value;
  const topic = document.getElementById('topic').value.trim();
  const type = document.getElementById('type').value;
  const prompt = `
    あなたは日本の学校教育に詳しい数学教師なのだ。
    次の条件に従って、1問だけ数学の問題を出題してほしいのだ。
    - 学年: ${grade}
    - 分野: ${topic}
    - 問題タイプ: ${type}
    - 回答も含めてほしいのだ。回答は「答え：」という表記で明記してほしいのだ。
    - 問題文、答えともに日本語で作成するのだ。
  `;
  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + apiKey,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    
    const data = await res.json();
    console.log('APIレスポンス:', data);
    if (data.error) {
      throw new Error(data.error.message || "不明なエラーが発生したのだ");
    }
    if (!data.choices || data.choices.length === 0) {
      throw new Error("APIから有効な選択肢が返されなかったのだ");
    }
    const output = data.choices[0].message.content;
    const [q, a] = output.split(/答え[:：]/);
    document.getElementById('questionText').textContent = q.trim();
    correctAnswer = a.trim().replace(/[。\\n]/g, '').trim();
    document.getElementById('questionBox').style.display = 'block';
    document.getElementById('result').textContent = '';
    document.getElementById('userAnswer').value = '';
  } catch (err) {
    console.error(err);
    alert('問題の生成に失敗したのだ… ' + err.message);
  }
}
// AIによる採点関数
async function checkAnswer() {
  const apiKey = document.getElementById('apiKey').value.trim();
  if (!apiKey) return alert('APIキーを入力してほしいのだ！');
  const userAnswer = document.getElementById('userAnswer').value.trim().replace(/[。\\n]/g, '');
  if (!userAnswer) {
    return alert("答えを入力してほしいのだ！");
  }
  // AIに採点してもらうためのプロンプト
  const prompt = `
    あなたは数学の問題を採点する名人なのだ。
    以下の情報を基に、ユーザーの解答が正しいかを判定して、結果と簡単な解説を記載してほしいのだ。
    ---  
    問題文: ${document.getElementById('questionText').textContent}
    正しい解答: ${correctAnswer}
    ユーザーの解答: ${userAnswer}
    ---  
    ユーザーの解答が正しい場合は「正解」と、間違っている場合は「不正解」と記し、必要な場合は簡単な説明を加えてほしいのだ。一番最初に「正解」「不正解」と言ってください。
  `;
  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + apiKey,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    const data = await res.json();
    console.log('採点APIレスポンス:', data);
    if (data.error) {
      throw new Error(data.error.message || "不明なエラーが発生したのだ");
    }
    if (!data.choices || data.choices.length === 0) {
      throw new Error("採点APIから有効な選択肢が返されなかったのだ");
    }
    const evaluation = data.choices[0].message.content;
    document.getElementById('result').textContent = evaluation.trim();
  } catch (err) {
    console.error(err);
    alert('採点に失敗したのだ… ' + err.message);
  }
}