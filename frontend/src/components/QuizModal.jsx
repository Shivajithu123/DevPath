import { useState } from 'react'

export default function QuizModal({ step, technology, onClose, onPass }) {
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(false)
  const [current, setCurrent] = useState(0)
  const [selected, setSelected] = useState(null)
  const [answers, setAnswers] = useState([])
  const [showResult, setShowResult] = useState(false)
  const [score, setScore] = useState(0)
  const [error, setError] = useState('')
  const [started, setStarted] = useState(false)

  const generateQuiz = async () => {
    setLoading(true)
    setError('')

    const prompt = `You are a coding quiz generator. Generate exactly 10 multiple choice questions to test knowledge about: "${step.title}" in the context of ${technology}.

Return ONLY valid JSON in this exact format:
{
  "questions": [
    {
      "question": "Question text here?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct": 0
    }
  ]
}

Rules:
- exactly 10 questions
- each question has exactly 4 options
- "correct" is the index (0,1,2,3) of the correct option
- questions should be practical and test real understanding
- vary difficulty from easy to hard
- Return ONLY JSON, no markdown`

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${import.meta.env.VITE_GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.7, maxOutputTokens: 2000 }
          })
        }
      )

      const data = await response.json()
      if (data.error) throw new Error(data.error.message)

      const text = data.candidates[0].content.parts[0].text
      const clean = text.replace(/```json\n?|```\n?/g, '').trim()
      const parsed = JSON.parse(clean)

      setQuestions(parsed.questions)
      setStarted(true)
    } catch (err) {
      setError('Failed to generate quiz. Please try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSelect = (index) => {
    if (selected !== null) return // already answered
    setSelected(index)
  }

  const handleNext = () => {
    const isCorrect = selected === questions[current].correct
    const newAnswers = [...answers, { selected, correct: questions[current].correct, isCorrect }]
    setAnswers(newAnswers)

    if (current + 1 < questions.length) {
      setCurrent(c => c + 1)
      setSelected(null)
    } else {
      // Quiz done
      const finalScore = newAnswers.filter(a => a.isCorrect).length
      setScore(finalScore)
      setShowResult(true)
    }
  }

  const passed = score >= 7 // 70% to pass

  // ── Pre-start screen ──
  if (!started) return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-surface border border-border rounded-2xl p-8 max-w-md w-full animate-fadeUp text-center">
        <div className="text-5xl mb-4">🧠</div>
        <div className="font-mono text-xs text-accent tracking-widest uppercase mb-3">Knowledge Check</div>
        <h2 className="font-syne font-extrabold text-2xl mb-3">Quiz Time!</h2>
        <p className="text-muted text-sm leading-relaxed mb-2">
          You just completed <span className="text-white font-bold">"{step.title}"</span>
        </p>
        <p className="text-muted text-sm leading-relaxed mb-6">
          Test your understanding with <span className="text-accent font-bold">10 multiple choice questions</span>. You need <span className="text-green-400 font-bold">7/10</span> to pass.
        </p>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl p-3 text-sm mb-4">{error}</div>
        )}

        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 border border-border py-3 rounded-xl text-sm font-syne font-bold hover:border-muted transition-colors text-muted">
            Skip Quiz
          </button>
          <button onClick={generateQuiz} disabled={loading}
            className="flex-1 bg-accent hover:opacity-90 disabled:opacity-50 text-white py-3 rounded-xl text-sm font-syne font-bold transition-opacity flex items-center justify-center gap-2">
            {loading ? (
              <>
                <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin-slow" />
                Generating...
              </>
            ) : 'Start Quiz →'}
          </button>
        </div>
      </div>
    </div>
  )

  // ── Results screen ──
  if (showResult) return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-surface border border-border rounded-2xl p-8 max-w-md w-full animate-fadeUp text-center">
        <div className="text-6xl mb-4">{passed ? '🎉' : '😅'}</div>
        <h2 className="font-syne font-extrabold text-3xl mb-2">
          {passed ? 'You Passed!' : 'Not Quite!'}
        </h2>
        <p className="text-muted text-sm mb-6">
          {passed
            ? 'Great understanding! Keep up the momentum.'
            : 'Review the step and try again to solidify your knowledge.'}
        </p>

        {/* Score circle */}
        <div className="relative w-32 h-32 mx-auto mb-6">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="40" fill="none" stroke="#2a2a3d" strokeWidth="8" />
            <circle cx="50" cy="50" r="40" fill="none"
              stroke={passed ? '#4ade80' : '#ff6a6a'}
              strokeWidth="8"
              strokeDasharray={`${(score / 10) * 251} 251`}
              strokeLinecap="round" />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-syne font-extrabold text-3xl">{score}/10</span>
            <span className="text-xs text-muted">{score * 10}%</span>
          </div>
        </div>

        {/* Answer breakdown */}
        <div className="flex justify-center gap-2 mb-6 flex-wrap">
          {answers.map((a, i) => (
            <div key={i}
              className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold
                ${a.isCorrect ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
              {i + 1}
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          {!passed && (
            <button onClick={() => {
              setCurrent(0); setSelected(null); setAnswers([])
              setShowResult(false); setScore(0); setStarted(false)
            }}
              className="flex-1 border border-border py-3 rounded-xl text-sm font-syne font-bold hover:border-accent transition-colors">
              Retry Quiz
            </button>
          )}
          <button onClick={() => { if (passed) onPass(); else onClose() }}
            className="flex-1 bg-accent hover:opacity-90 text-white py-3 rounded-xl text-sm font-syne font-bold transition-opacity">
            {passed ? 'Continue →' : 'Skip & Continue'}
          </button>
        </div>
      </div>
    </div>
  )

  // ── Question screen ──
  const q = questions[current]
  const isAnswered = selected !== null

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-surface border border-border rounded-2xl p-8 max-w-lg w-full animate-fadeUp">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="font-mono text-xs text-muted tracking-widest">
            QUESTION {current + 1}/10
          </div>
          <div className="flex gap-1">
            {questions.map((_, i) => (
              <div key={i} className={`h-1.5 w-6 rounded-full transition-all ${
                i < current ? 'bg-green-400' :
                i === current ? 'bg-accent' : 'bg-border'
              }`} />
            ))}
          </div>
        </div>

        {/* Topic badge */}
        <div className="font-mono text-xs text-accent bg-accent/10 border border-accent/20 px-3 py-1.5 rounded-full inline-block mb-4">
          {step.title}
        </div>

        {/* Question */}
        <h3 className="font-syne font-bold text-lg mb-6 leading-snug">{q.question}</h3>

        {/* Options */}
        <div className="space-y-3 mb-6">
          {q.options.map((option, i) => {
            let style = 'border-border hover:border-accent bg-surface2'
            if (isAnswered) {
              if (i === q.correct) style = 'border-green-500 bg-green-500/10'
              else if (i === selected && i !== q.correct) style = 'border-red-500 bg-red-500/10'
              else style = 'border-border bg-surface2 opacity-50'
            }

            return (
              <button key={i} onClick={() => handleSelect(i)}
                className={`w-full text-left border rounded-xl px-4 py-3.5 transition-all flex items-center gap-3 ${style}`}>
                <span className={`w-7 h-7 rounded-lg border flex items-center justify-center text-xs font-bold flex-shrink-0 font-mono
                  ${isAnswered && i === q.correct ? 'bg-green-500 border-green-500 text-white' :
                    isAnswered && i === selected && i !== q.correct ? 'bg-red-500 border-red-500 text-white' :
                    'border-border text-muted'}`}>
                  {String.fromCharCode(65 + i)}
                </span>
                <span className="text-sm leading-snug">{option}</span>
                {isAnswered && i === q.correct && <span className="ml-auto text-green-400 text-lg">✓</span>}
                {isAnswered && i === selected && i !== q.correct && <span className="ml-auto text-red-400 text-lg">✗</span>}
              </button>
            )
          })}
        </div>

        {/* Explanation after answering */}
        {isAnswered && (
          <div className={`rounded-xl p-3 mb-4 text-sm ${selected === q.correct ? 'bg-green-500/10 border border-green-500/30 text-green-400' : 'bg-red-500/10 border border-red-500/30 text-red-400'}`}>
            {selected === q.correct
              ? '✓ Correct! Well done.'
              : `✗ Incorrect. The correct answer is: "${q.options[q.correct]}"`}
          </div>
        )}

        {/* Next button */}
        <button onClick={handleNext} disabled={!isAnswered}
          className="w-full bg-accent hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed text-white font-syne font-bold py-3 rounded-xl transition-opacity">
          {current + 1 === questions.length ? 'See Results →' : 'Next Question →'}
        </button>
      </div>
    </div>
  )
}