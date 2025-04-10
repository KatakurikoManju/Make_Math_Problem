// processMathText()：テキスト内の不要な \( と \) を除去し、
    // 改行文字で分割した場合、複数行なら aligned 環境に変換する
    function processMathText(text) {
      // \( と \) を除去
      text = text.replace(/\\\(|\\\)/g, '');
      // 改行文字で分割し、各行をトリムする
      const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
      if (lines.length === 0) return "";
      if (lines.length === 1) {
        return lines[0];
      } else {
        let result = '\\begin{aligned} ';
        for (let i = 0; i < lines.length; i++) {
          // 各行を \text{...} 内に入れて出力
          result += '\\text{' + lines[i] + '}';
          if (i < lines.length - 1) {
            result += ' \\\\ ';
          }
        }
        result += ' \\end{aligned}';
        return result;
      }
    }

    // MathJax の再レンダリング
    function renderMath() {
      MathJax.typesetPromise();
    }

    // 問題生成関数：問題文のみ作成
    async function generateQuestion() {
      const apiKey = document.getElementById('apiKey').value.trim();
      if (!apiKey) return alert('APIキーを入力してほしいのだ！');

      // 状況表示：生成中
      document.getElementById('questionText').innerHTML = "";
      document.getElementById('questionBox').style.display = 'block';
      document.getElementById('result').innerHTML = '<span class="loading">問題生成中…</span>';
      renderMath();

      const selectedModel = document.getElementById('modelChoice').value;
      const grade = document.getElementById('grade').value;
      const difficulty = document.getElementById('difficulty').value;
      const topic = document.getElementById('topic').value.trim();
      const type = document.getElementById('type').value;

      const prompt = `あなたは日本の学校教育に詳しい数学教師なのだ。
以下の条件に従い、1問だけ数学の問題を出題するのだ。ただし、解答や解説は含めず、問題文のみ作成するのだ。
- 学年: ${grade}
- 学年内の難易度: ${difficulty}
- 分野: ${topic}
- 問題タイプ: ${type}
- 問題文は日本語で作成するのだ。`;

      try {
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + apiKey
          },
          body: JSON.stringify({
            model: selectedModel,
            messages: [{ role: 'user', content: prompt }]
          })
        });
        
        const data = await res.json();
        console.log('APIレスポンス:', data);
        if (data.error) {
          throw new Error(data.error.message || "不明なエラーが発生したのだ");
        }
        if (!data.choices || data.choices.length === 0) {
          throw new Error("APIから有効な選択肢が返されなかったのだ");
        }
        let questionText = data.choices[0].message.content.trim();
        // 改行を反映するため aligned 環境に変換
        questionText = processMathText(questionText);
        // 表示時は $$ ... $$ で囲む
        document.getElementById('questionText').innerHTML = `<div style="overflow-wrap: break-word;">$$${questionText}$$</div>`;
        document.getElementById('result').textContent = "";
        document.getElementById('userAnswer').value = '';
        renderMath();
      } catch (err) {
        console.error(err);
        document.getElementById('questionText').textContent = "";
        document.getElementById('result').textContent = "";
        alert('問題の生成に失敗したのだ… ' + err.message);
      }
    }

    // 採点関数：必ず「正解」または「不正解」で始める
    async function checkAnswer() {
      const apiKey = document.getElementById('apiKey').value.trim();
      if (!apiKey) return alert('APIキーを入力してほしいのだ！');

      const selectedModel = document.getElementById('modelChoice').value;
      const userAnswer = document.getElementById('userAnswer').value.trim().replace(/[。\\n]/g, '');
      if (!userAnswer) return alert("答えを入力してほしいのだ！");

      document.getElementById('result').innerHTML = '<span class="loading">採点中…</span>';
      renderMath();

      const prompt = `あなたは数学の問題を採点する名人なのだ。
まず、以下の問題文に対して正しい解答を導出し、その上でユーザーの解答が正しいかどうか判定するのだ。
必ず出力の最初に「正解」または「不正解」と記し、その後に理由と解説を述べるのだ。
---
問題文: ${document.getElementById('questionText').textContent.replace(/<[^>]+>/g, '')}
ユーザーの解答: ${userAnswer}
---`;
      
      try {
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + apiKey
          },
          body: JSON.stringify({
            model: selectedModel,
            messages: [{ role: 'user', content: prompt }]
          })
        });
        const data = await res.json();
        console.log('採点APIレスポンス:', data);
        if (data.error) {
          throw new Error(data.error.message || "不明なエラーが発生したのだ");
        }
        if (!data.choices || data.choices.length === 0) {
          throw new Error("採点APIから有効な選択肢が返されなかったのだ");
        }
        let evaluation = data.choices[0].message.content.trim();
        evaluation = processMathText(evaluation);
        document.getElementById('result').innerHTML = `<div style="overflow-wrap: break-word;">$$${evaluation}$$</div>`;
        renderMath();
      } catch (err) {
        console.error(err);
        document.getElementById('result').textContent = "";
        alert('採点に失敗したのだ… ' + err.message);
      }
    }