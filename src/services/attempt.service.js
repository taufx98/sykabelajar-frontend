(function(){
  const c=()=>window.SYKA_SUPABASE.get();
  async function start(competitionId){const{data,error}=await c().rpc('start_competition_attempt',{p_competition_id:competitionId});if(error)throw error;return data;}
  async function getResume(attemptId){const{data,error}=await c().rpc('get_attempt_resume',{p_attempt_id:attemptId});if(error)throw error;return data||null;}
  async function saveAnswer({attemptId,questionId,answerJson}){const{data,error}=await c().rpc('save_attempt_answer',{p_attempt_id:attemptId,p_question_id:questionId,p_answer_json:answerJson||{}});if(error)throw error;return data;}
  async function submit({attemptId,idempotencyKey}){const{data,error}=await c().rpc('submit_competition_attempt',{p_attempt_id:attemptId,p_idempotency_key:idempotencyKey||crypto.randomUUID()});if(error)throw error;return data;}
  window.SYKA_ATTEMPT_SERVICE={start,saveAnswer,submit,getResume};
})();
