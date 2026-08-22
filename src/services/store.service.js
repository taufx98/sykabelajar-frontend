(function(){
  function client(){return window.SYKA_SUPABASE.get();}

  function roleAudience(){
    const roles=window.SYKA_STATE.getState().auth.roles||[];
    if(roles.includes('admin')) return ['student','teacher','organizer'];
    const out=[];
    if(roles.includes('student')) out.push('student');
    if(roles.includes('teacher')) out.push('teacher');
    if(roles.includes('organizer_member')) out.push('organizer');
    return out.length?out:['student'];
  }

  async function listProducts(){
    const {data,error}=await client().from('commerce_products').select('*').eq('is_active',true).order('sort_order',{ascending:true}).order('created_at',{ascending:false});
    if(error)throw error;
    const products=data||[];
    const ids=products.map(p=>p.id);
    if(!ids.length)return[];
    const {data:benefits,error:be}=await client().from('commerce_product_benefits').select('*').in('product_id',ids).order('created_at',{ascending:true});
    if(be)throw be;
    const map={};
    (benefits||[]).forEach(b=>(map[b.product_id]??=[]).push(b));
    const audience=roleAudience();
    return products.filter(p=>p.audiences?.some(a=>audience.includes(a))).map(p=>({...p,benefits:map[p.id]||[]}));
  }

  async function listEntitlements(userId){
    if(!userId)return[];
    const {data,error}=await client().from('user_product_entitlements').select('*').eq('user_id',userId).order('created_at',{ascending:false});
    if(error)throw error;
    return data||[];
  }

  async function createProductOrder(productId,quantity=1){
    const {data,error}=await client().rpc('create_product_order',{p_product_id:productId,p_quantity:Math.max(1,Number(quantity)||1)});
    if(error)throw error;
    return data;
  }

  window.SYKA_STORE_SERVICE={listProducts,listEntitlements,createProductOrder};
})();
