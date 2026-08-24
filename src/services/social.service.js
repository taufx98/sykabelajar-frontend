(function(){
  const c=()=>window.SYKA_SUPABASE.get();
  async function listPosts({limit=20}= {}){const {data,error}=await c().from('posts').select('id,user_id,kind,body,media_url,created_at,like_count,comment_count').eq('visibility','PUBLIC').order('created_at',{ascending:false}).limit(limit);if(error)throw error;return data||[];}
  async function like(postId){const {data,error}=await c().rpc('toggle_post_like',{p_post_id:postId});if(error)throw error;return data;}
  async function comment(postId,body){const {data,error}=await c().rpc('create_post_comment',{p_post_id:postId,p_body:body});if(error)throw error;return data;}
  async function listComments(postId){const {data,error}=await c().from('comments').select('id,user_id,body,created_at,like_count').eq('post_id',postId).eq('status','PUBLISHED').order('created_at',{ascending:true});if(error)throw error;return data||[];}
  window.SYKA_SOCIAL_SERVICE={listPosts,like,comment,listComments};
})();
