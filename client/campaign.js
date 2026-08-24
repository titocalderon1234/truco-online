(function(root,factory){
  if(typeof module==='object'&&module.exports) module.exports=factory(require('./bots'));
  else root.TrucoCampaign=factory(root.TrucoBots);
})(typeof self!=='undefined'?self:this,function(Bots){
  'use strict';

  const STORAGE_KEY='trucoCityFury';
  const FIXED_MIDDLE='chiqui';
  const FIXED_FINAL='cristina';
  const NORMAL_IDS=Bots.BOT_ORDER.filter(id=>id!==FIXED_MIDDLE&&id!==FIXED_FINAL);

  const META={
    clara:{
      short:'La dama del café que te sonríe mientras te arma la trampa.',
      bio:'Clara aprendió a jugar escuchando partidas interminables en el fondo del café de su familia, donde descubrió que en el Truco importa mucho menos lo que tenés que la cara que ponés cuando lo cantás. Nunca grita, nunca se apura y siempre tiene esa sonrisa de alguien que sabe algo que vos no. Tiene una especialidad: hacerte aceptar un Envido completamente dudoso mientras te habla como si estuviera ofreciéndote otra medialuna. Cuanto más tranquila parece, peor viene la cosa. Dicen que una vez ganó seis manos seguidas sin tener una sola carta buena y que el rival terminó pidiéndole disculpas a ella. Su consejo favorito es simple: “Si vas a mentir, por lo menos hacelo con educación”.'
    },
    ferraro:{
      short:'No juega una partida: dirige una operación militar de tres cartas.',
      bio:'Ferraro pasó tantos años dando órdenes que todavía no termina de comprender por qué el rival tiene permitido decir “No quiero”. Para él una partida de Truco no es entretenimiento: es una operación militar de tres cartas y absolutamente todo necesita una estrategia. No suele mentir porque considera que el bluff es una pérdida de tiempo. Si canta Truco, probablemente tenga cartas. Si canta Retruco, seguramente tenga cartas muy buenas. Y si llega al Vale Cuatro, capaz conviene empezar a despedirse de los puntos. Juega rápido, fuerte y con cero paciencia. Una vez tardaron demasiado en repartir y organizó una cadena de mando para decidir quién mezclaba. Desde entonces nadie vuelve a preguntarle quién es mano.'
    },
    walter:{
      short:'Maneja las cartas como la ruta: rápido, fuerte y con demasiada fe.',
      bio:'Walter asegura haber jugado al Truco en todas las provincias del país, en siete estaciones de servicio distintas y una vez arriba de un camión detenido en la banquina. Nadie pudo verificar ninguna de esas historias, pero él las cuenta con suficiente seguridad como para que parezcan ciertas. Juega exactamente como maneja: rápido, confiado y con una preocupante predisposición a adelantar cuando no debería. Puede cantar Truco con una mano excelente o con un cuatro, un cinco y una fe inquebrantable en sí mismo. Según Walter, pensar demasiado “enfría las cartas”. Su estrategia consiste básicamente en tomar una decisión antes que vos y después actuar como si hubiera sido obvia desde el principio. Increíblemente, a veces funciona.'
    },
    celia:{
      short:'Te deja hacer todo tranquilo hasta que descubrís que era exactamente su plan.',
      bio:'Celia lleva décadas atendiendo su puesto y aprendió algo fundamental: si uno se queda callado el tiempo suficiente, la gente termina contando más de lo que debería. En el Truco aplica exactamente la misma técnica. Nunca parece apurada. Te deja cantar, subir, dudar y entusiasmarte hasta que de repente te das cuenta de que llevás cinco minutos haciendo exactamente lo que ella quería. Su frase favorita es “hacé lo que quieras, querido”, una oración que ya destruyó incontables partidas. No suele inventar grandes mentiras porque no las necesita. Prefiere que vos mismo te convenzas de que vas ganando. Más de uno llegó sobrado al Retruco contra Celia y terminó preguntándose en qué momento perdió el control de su propia partida.'
    },
    tomi:{
      short:'Cara de inocente, estadísticas de delincuente del bluff.',
      bio:'Tomi aprendió a jugar rodeado de personas mucho mayores que él y rápidamente descubrió que para competir necesitaba algo más efectivo que buenas cartas: una capacidad extraordinaria para decir cualquier cosa sin que se le mueva una ceja. Puede cantar Envido con 21, Truco con tres cartas horribles y mirar al rival con tanta tranquilidad que empieza a parecer irresponsable no creerle. El problema es que cuando realmente tiene una mano espectacular hace exactamente la misma cara. Tomi asegura que nunca miente, simplemente “interpreta creativamente la situación”. Una vez consiguió que un rival se fuera al mazo teniendo el ancho de espadas. Desde entonces cuenta esa historia cada vez que juega, aunque probablemente también sea mentira.'
    },
    raul:{
      short:'Canta tango, canta Truco y, si lo dejás, te cuenta el fin de semana entero.',
      bio:'Raúl pasó tantos años cantando en bares como jugando partidas después de cada show. Para él el Truco no es solamente un juego: es una oportunidad para hablar durante veinte minutos sin que nadie pueda levantarse de la mesa. Comenta cada carta, recuerda anécdotas, canta fragmentos de tango, provoca al rival y de alguna manera todavía encuentra tiempo para pensar sus jugadas. Nadie sabe cuándo está distrayendo y cuándo realmente se olvidó de quién ganó la primera baza. Su estilo cambia constantemente. Puede pasar tres manos sin cantar absolutamente nada y después intentar un Falta Envido con una seguridad inexplicable. Muchos rivales terminan tan agotados de escucharlo que aceptan solamente para que la partida avance.'
    },
    vicky:{
      short:'Si tiene ventaja, aprieta. Si no tiene ventaja, revisa qué se rompió.',
      bio:'Vicky pasa el día arreglando motores y tiene poca tolerancia para cualquier cosa que dé más vueltas de las necesarias. Con el Truco piensa exactamente igual: si tiene buenas cartas, las usa; si puede presionarte, te presiona; y si puede terminar la mano ahora, no entiende por qué habría que esperar. No es demasiado mentirosa, así que cuando empieza a subir apuestas normalmente existe un motivo bastante preocupante. Su gran problema es que tampoco sabe jugar despacio, por lo que a veces termina llevando una mano común hasta lugares completamente innecesarios. Una vez discutió una parda durante tanto tiempo que terminó arreglando el carburador del rival mientras seguían discutiendo. Ganó la discusión. Del partido nadie se acuerda.'
    },
    dante:{
      short:'Si parece nervioso está actuando. Si parece tranquilo, probablemente también.',
      bio:'Nadie sabe exactamente dónde aprendió Dante a jugar porque cuenta una historia diferente cada vez que alguien se lo pregunta. En una versión fue en un bar de Constitución, en otra en un barco y en otra aparentemente estuvo involucrado un cura, dos policías y una mesa sin una pata. Dante disfruta mucho más engañándote que ganándote. Puede dudar con una mano excelente, hacerse el confiado con tres cartas inútiles o dejar pasar una oportunidad evidente solamente para que empieces a preguntarte qué está preparando. Es capaz de cantar Truco con tres cuatros y hacerte sentir ridículo por no aceptarlo. Si parece nervioso, probablemente está actuando. Si parece tranquilo, probablemente también. Contra Dante, desconfiar no es una estrategia: es supervivencia.'
    },
    chiqui:{
      short:'Si hay 30 cosas para ordenar, hace dos grupos de 15 y listo.',
      bio:'El Chiqui nunca fue de complicarse demasiado: si tiene 30 cosas para ordenar, las divide en dos grupos de 15 y problema solucionado. En el Truco aplica exactamente la misma filosofía: todo tranquilo, todo prolijo y, si alguna regla se complica demasiado, siempre se puede inventar otra competencia. Su verdadero rival no está sentado enfrente sino arriba, en el termómetro. Cada dos manos aparece misteriosamente alguien a secarle la nuca, porque aparentemente administrar semejante estructura produce una cantidad de calor que ningún ventilador conocido puede combatir. Dicen que una vez intentó organizar una partida entre cuatro personas y terminó creando dos torneos, tres copas, una fecha interzonal y un desempate que nadie entendió. Lo importante es que todos jugaron.'
    },
    cristina:{
      short:'La jefa final del relato: 100 de Mentiroso y cero ganas de reconocer una derrota.',
      bio:'Cristina es peroncha hasta para elegir el palo de la carta y juega al Truco todos los días desde su balcón con Alberto Fernández. Nadie sabe exactamente quién va ganando porque después de cada mano los dos cuentan una versión completamente distinta del resultado. Tiene 100 de Mentiroso: puede tener 20 de Envido, cantar 33 y explicarlo durante tanto tiempo que terminás agarrando el reglamento para verificar si quizás el que entendió mal el juego eras vos. Cuando pierde, encuentra rápidamente una explicación sencilla: fue culpa de Macri. En la biografía del juego terminó dedicándose profesionalmente al Truco porque no sirve para absolutamente ninguna otra cosa, pero finalmente encontró su especialidad: chamuyar, discutir cada punto y convertir una derrota clarísima en una “victoria histórica”.'
    }
  };

  function shuffle(list,rng=Math.random){
    const a=[...list];
    for(let i=a.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[a[i],a[j]]=[a[j],a[i]];}
    return a;
  }
  function validRoute(route){
    if(!Array.isArray(route)||route.length!==10)return false;
    if(new Set(route).size!==10)return false;
    if(route[4]!==FIXED_MIDDLE||route[9]!==FIXED_FINAL)return false;
    return Bots.BOT_ORDER.every(id=>route.includes(id));
  }
  function createCampaign(rng=Math.random){
    const mixed=shuffle(NORMAL_IDS,rng);
    return {version:2,route:[...mixed.slice(0,4),FIXED_MIDDLE,...mixed.slice(4),FIXED_FINAL],defeated:[],completed:false,createdAt:Date.now()};
  }
  function normalizeCampaign(raw,rng=Math.random){
    const base=raw&&validRoute(raw.route)?{...raw,route:[...raw.route]}:createCampaign(rng);
    base.version=2;
    base.defeated=[...new Set((base.defeated||[]).filter(id=>Bots.BOT_ORDER.includes(id)))];
    // Progress must remain sequential; discard impossible wins after the first gap.
    const sequential=[];
    for(const id of base.route){if(base.defeated.includes(id))sequential.push(id);else break;}
    base.defeated=sequential;
    base.completed=base.defeated.length===base.route.length;
    return base;
  }
  function nextIndex(campaign){return campaign.route.findIndex(id=>!campaign.defeated.includes(id));}
  function statusAt(campaign,index){
    const id=campaign.route[index];
    if(campaign.defeated.includes(id))return 'defeated';
    const next=nextIndex(campaign);
    if(next===index)return 'available';
    return 'locked';
  }
  function canPlay(campaign,botId){
    const i=campaign.route.indexOf(botId);if(i<0)return false;
    const s=statusAt(campaign,i);return s==='available'||s==='defeated';
  }
  function recordWin(campaign,botId){
    const c=normalizeCampaign(campaign);
    const index=c.route.indexOf(botId);
    if(index<0)return {campaign:c,newlyDefeated:false,unlocked:null,completed:c.completed};
    const status=statusAt(c,index);
    if(status==='locked')return {campaign:c,newlyDefeated:false,unlocked:null,completed:c.completed};
    const newlyDefeated=status==='available';
    if(newlyDefeated)c.defeated.push(botId);
    c.completed=c.defeated.length===c.route.length;
    const ni=nextIndex(c);
    return {campaign:c,newlyDefeated,unlocked:ni>=0?c.route[ni]:null,completed:c.completed};
  }
  function progress(campaign){return {won:campaign.defeated.length,total:campaign.route.length,completed:campaign.completed};}

  return {STORAGE_KEY,FIXED_MIDDLE,FIXED_FINAL,NORMAL_IDS,META,shuffle,validRoute,createCampaign,normalizeCampaign,nextIndex,statusAt,canPlay,recordWin,progress};
});
