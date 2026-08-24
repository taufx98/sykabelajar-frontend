(function(){
  const c=()=>window.SYKA_SUPABASE.get();
  async function listTasks(){const {data,error}=await c().from('daily_tasks').select('*').eq('is_active',true).order('sort_order',{ascending:true}).order('created_at',{ascending:false});if(error)throw error;return data||[];}
  async function claim(taskId){const {data,error}=await c().rpc('claim_daily_task',{p_task_id:taskId});if(error)throw error;return data;}
  async function complete(taskId){const {data,error}=await c().rpc('complete_daily_task',{p_task_id:taskId});if(error)throw error;return data||{};}
  window.SYKA_TASK_SERVICE={listTasks,claim,complete};
})();
