(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.TrucoProfile=api;
})(typeof self!=='undefined'?self:this,function(){
  const STORAGE_KEY='trucoProfile';
  const AVATARS=[
    {id:'abuela_mate',name:'Clásica',tag:'vieja escuela'},
    {id:'flor_criolla',name:'Criolla',tag:'folklórica'},
    {id:'gaucho_bravo',name:'Gaucho',tag:'bravo'},
    {id:'pibe_boina',name:'Pibe',tag:'pícaro'},
    {id:'don_bigote',name:'Paisano',tag:'tradicional'},
    {id:'dandy_criollo',name:'Dandy',tag:'elegante'},
    {id:'tano_alegre',name:'Fiestero',tag:'alegre'},
    {id:'paisana',name:'Paisana',tag:'serena'}
  ];
  const AVATAR_IDS=AVATARS.map(a=>a.id);
  const LEGACY_IDS=['tano','piba','gaucho','abuela','pibe','parrillero','cantora','mago'];
  const DEFAULT={name:'Jugador',avatar:AVATAR_IDS[0],wins:0,coins:250,streak:0};
  function cleanName(name){
    const s=String(name??'').replace(/\s+/g,' ').trim().slice(0,16);
    return s||DEFAULT.name;
  }
  function validAvatar(id){return AVATAR_IDS.includes(id);}
  function renderableAvatar(id){return validAvatar(id)||LEGACY_IDS.includes(id);}
  function normalize(p){
    p=(p&&typeof p==='object')?p:{};
    return {
      name:cleanName(p.name),
      avatar:validAvatar(p.avatar)?p.avatar:DEFAULT.avatar,
      wins:Number.isFinite(Number(p.wins))?Math.max(0,Math.floor(Number(p.wins))):0,
      coins:Number.isFinite(Number(p.coins))?Math.max(0,Math.floor(Number(p.coins))):250,
      streak:Number.isFinite(Number(p.streak))?Math.max(0,Math.floor(Number(p.streak))):0
    };
  }
  function getAvatar(id){return AVATARS.find(a=>a.id===id)||AVATARS[0];}
  return {STORAGE_KEY,AVATARS,AVATAR_IDS,LEGACY_IDS,DEFAULT,cleanName,validAvatar,renderableAvatar,normalize,getAvatar};
});
