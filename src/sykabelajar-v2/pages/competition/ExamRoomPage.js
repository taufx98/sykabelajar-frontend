export function ExamRoomPage(data = {}) {
  return `
    <section class="sy-exam-room">

      <div class="sy-exam-header">
        <h1 class="sy-heading-lg">
          ${data.title || "Exam Room"}
        </h1>

        <span>
          Time Remaining:
          ${data.timer || "00:00"}
        </span>
      </div>


      <div class="sy-question-box">

        <h2>
          Question ${data.number || 1}
        </h2>

        <p>
          ${data.question || "Question content"}
        </p>

      </div>

    </section>
  `;
}
