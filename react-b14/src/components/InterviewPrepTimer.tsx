import { useEffect, useState } from 'react';

const DURATION_SECONDS = 120;

const QUESTIONS = [
  'Ceritakan proyek IT yang pernah kamu kerjakan dan kontribusimu.',
  'Apa perbedaan props dan state pada React?',
  'Bagaimana kamu mencari dan memperbaiki bug pada aplikasi?',
  'Jelaskan cara frontend berkomunikasi dengan REST API.',
  'Apa yang kamu lakukan ketika mendapat tugas dengan teknologi baru?',
];

export function InterviewPrepTimer() {
  const [questionIndex, setQuestionIndex] = useState(0);
  const [seconds, setSeconds] = useState(DURATION_SECONDS);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    if (!isRunning || seconds === 0) return;

    const intervalId = window.setInterval(() => {
      setSeconds((previous) => Math.max(0, previous - 1));
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [isRunning, seconds, questionIndex]);

  function resetTimer() {
    setIsRunning(false);
    setSeconds(DURATION_SECONDS);
  }

  function nextQuestion() {
    resetTimer();
    setQuestionIndex(
      (previous) => (previous + 1) % QUESTIONS.length,
    );
  }

  const minutesText = String(
    Math.floor(seconds / 60),
  ).padStart(2, '0');

  const secondsText = String(seconds % 60).padStart(2, '0');
  const running = isRunning && seconds > 0;

  return (
    <section
      className="panel-box interview-prep"
      aria-label="Latihan Interview"
    >
      <h3>Latihan Interview</h3>

      <p className="muted-text">
        Soal {questionIndex + 1} dari {QUESTIONS.length}
      </p>

      <p>{QUESTIONS[questionIndex]}</p>

      <p
        className="interview-timer"
        role="timer"
        aria-label="Sisa waktu"
      >
        {minutesText}:{secondsText}
      </p>

      {seconds === 0 && (
        <p role="status">
          Waktu habis. Reset atau lanjut ke soal berikutnya.
        </p>
      )}

      <div className="interview-actions">
        <button
          type="button"
          className="btn btn-primary"
          disabled={seconds === 0}
          onClick={() => setIsRunning((previous) => !previous)}
        >
          {running ? 'Pause' : 'Start'}
        </button>

        <button
          type="button"
          className="btn btn-outline"
          onClick={resetTimer}
        >
          Reset
        </button>

        <button
          type="button"
          className="btn btn-outline"
          onClick={nextQuestion}
        >
          Soal Berikutnya
        </button>
      </div>
    </section>
  );
}