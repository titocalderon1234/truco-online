(function(root,factory){
  if(typeof module==='object'&&module.exports) module.exports=factory(require('./trucoCore'));
  else root.TrucoBots=factory(root.TrucoCore);
})(typeof self!=='undefined'?self:this,function(Core){
  'use strict';
  const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n));
  const chance=p=>Math.random()<clamp(p);
  const pick=a=>a[Math.floor(Math.random()*a.length)];
  const BOT_ORDER=['clara','ferraro','walter','celia','tomi','raul','vicky','dante','chiqui','cristina'];

  const BOTS={
    clara:{id:'clara',name:'Clara “La Porteña” Bianchi',avatar:'clara',style:'tramposa elegante',stats:{mentiroso:82,pescador:73,agresivo:34},trait:'trap'},
    ferraro:{id:'ferraro',name:'Comandante Ferraro',avatar:'ferraro',style:'ataque frontal',stats:{mentiroso:14,pescador:28,agresivo:92},trait:'frontal'},
    walter:{id:'walter',name:'Walter “Ruta” Benítez',avatar:'walter',style:'caos controlado',stats:{mentiroso:47,pescador:25,agresivo:78},trait:'impulsive'},
    celia:{id:'celia',name:'Celia “La Turquesa” Quiroga',avatar:'celia',style:'pescadora máxima',stats:{mentiroso:31,pescador:91,agresivo:22},trait:'fisher'},
    tomi:{id:'tomi',name:'Tomi “Colorado” Sosa',avatar:'tomi',style:'bluff puro',stats:{mentiroso:88,pescador:52,agresivo:66},trait:'chaotic'},
    raul:{id:'raul',name:'Raúl “El Zorzal” Medina',avatar:'raul',style:'equilibrado y charlatán',stats:{mentiroso:69,pescador:63,agresivo:55},trait:'balanced'},
    vicky:{id:'vicky',name:'Vicky “La Tuerca” Pereyra',avatar:'vicky',style:'directa y agresiva',stats:{mentiroso:25,pescador:38,agresivo:84},trait:'efficient'},
    dante:{id:'dante',name:'Dante “El Flaco” Ferreyra',avatar:'dante',style:'embaucador',stats:{mentiroso:94,pescador:87,agresivo:41},trait:'deceptive'},
    chiqui:{id:'chiqui',name:'El Chiqui “Mafia” Tapia',avatar:'chiqui',style:'formato especial',stats:{mentiroso:15,pescador:15,agresivo:15},trait:'conservative'},
    cristina:{id:'cristina',name:'Cristina “La Reina” Kuka',avatar:'cristina',style:'relato adaptativo',stats:{mentiroso:100,pescador:50,agresivo:50},trait:'adaptive'}
  };

  const P={
    clara:{
      start:['Sentate tranquilo, querido.','Jugamos despacito, ¿sí?','Espero que sepas contar.','No te pongas nervioso antes de empezar.','Tres cartitas nomás. ¿Qué podría salir mal?'],
      envido:['Envido… si no te molesta.','Tengo unos puntitos por acá.','¿Jugamos los tantos?','No parece mucho, ¿no?','Envido, querido. Pensalo.'],
      truco:['Bueno… Truco.','No quería decirlo, pero Truco.','Ya que estamos… Truco.','Truco. Sin ponerse nervioso.','Probemos algo: Truco.'],
      retruco:['¿Te entusiasmaste? Retruco.','Bueno, ahora sí se puso interesante.','Retruco, querido.'],
      vale4:['¿Llegamos hasta acá? Vale Cuatro.','Bueno… terminemos lo que empezamos. Vale Cuatro.'],
      quiero:['Quiero. Obviamente.','Dale, veamos.','Acepto. Vos sabrás.','Bueno, querido.'],
      noQuiero:['No, gracias. Tampoco soy tonta.','Esta te la regalo.','Quedátela, haceme el favor.'],
      trickWin:['Ay… ¿esa era tu buena?','Qué pena.','Veníamos tan bien…','Anotala mentalmente.'],
      trickLose:['Mirá vos.','Una te tenía que salir.','Bien jugado… por ahora.'],
      tie:['Qué casualidad.','Mirá cómo nos encontramos.'],
      handWin:['La cara te vendió antes que las cartas.','No era tan difícil, querido.','Te apuraste un poquito.','Hay que aprender a desconfiar.'],
      handLose:['Bueno… esta vez salió.','Disfrutala mientras dure.','Una mala tarde la tiene cualquiera.'],
      matchWin:['Fue un placer. Para mí, principalmente.','Volvé cuando quieras practicar.','Te faltó calle, querido.'],
      matchLose:['Mirá vos… aprendiste.','No estuvo mal. Para ser vos.','Bueno, ahora quiero la revancha.']
    },
    ferraro:{
      start:['Comienza la operación.','Tres cartas. Un ganador.','Sin vueltas.','Concentración.','Prepare su defensa.'],
      envido:['¡ENVIDO!','Informe sus tantos.','Procedemos con el Envido.','Quiero los puntos.'],
      truco:['¡TRUCO!','Aumentamos la apuesta.','Proceda. Truco.','Es hora de avanzar.','Ataque frontal: Truco.'],
      retruco:['¡RETRUCO!','Escalamos el conflicto.','No retrocedemos. Retruco.'],
      vale4:['¡VALE CUATRO!','Esto termina acá.','Última ofensiva: Vale Cuatro.'],
      quiero:['Quiero.','Aceptado.','Continúe.','Autorizado.'],
      noQuiero:['Retirada táctica.','Negativo.','No vale la pérdida de recursos.'],
      trickWin:['Objetivo asegurado.','Posición tomada.','Según lo previsto.'],
      trickLose:['Error táctico.','Recalculando.','No se repetirá.'],
      tie:['Empate operacional.','Sin ventajas.'],
      handWin:['Operación completada.','Resultado esperado.','La estrategia fue superior.'],
      handLose:['Falló la ejecución.','Necesitamos reorganizarnos.','Esto requiere una investigación interna.'],
      matchWin:['Misión cumplida.','Retírese de la mesa.','Victoria total.'],
      matchLose:['Acepto el resultado.','Habrá una segunda operación.','Esto no termina acá.']
    },
    walter:{
      start:['Dale que tengo que seguir viaje.','Tres cartas y seguimos ruta.','No me hagas estacionar acá.','Vamos que se hace de noche.','Poné primera.'],
      envido:['¡ENVIDO!','Tengo unos numeritos.','Metamos los tantos.','Dale, sin calculadora.'],
      truco:['¡TRUCO, PAPÁ!','¡A fondo! Truco.','Pisalo: Truco.','Vamos por el carril rápido.','¡TRUCO y que sea lo que Dios quiera!'],
      retruco:['¡RETRUCO!','Metemos quinta.','Ahora no frenes: Retruco.'],
      vale4:['¡VALE CUATRO!','Sin cinturón. Vale Cuatro.','Nos quedamos sin frenos.'],
      quiero:['Quiero, obvio.','Dale nomás.','Yo no vine hasta acá para frenar.','Aceptadísimo.'],
      noQuiero:['Uh, esa salida no era.','Me bajo acá.','Esta te la dejo pasar.'],
      trickWin:['Te pasé por la banquina.','Ni puse quinta todavía.','Seguí las luces.'],
      trickLose:['Había un pozo.','Me cerraste justo.','Esa ruta estaba mal señalizada.'],
      tie:['Llegamos juntos al peaje.','Foto finish.'],
      handWin:['Ruta liberada.','Te quedaste sin nafta.','Así se juega en la banquina.'],
      handLose:['Había viento en contra.','El GPS me mandó mal.','Esa mano tenía radares.'],
      matchWin:['Bueno, sigo viaje.','Te dejé en la estación de servicio.','Gracias por acompañar el recorrido.'],
      matchLose:['Bueno… había que parar a cargar.','Revancha y esta vez manejo yo.','No siempre se llega primero.']
    },
    celia:{
      start:['Jugá nomás, querido.','Yo no tengo ningún apuro.','Pensalo bien.','Hacé tranquilo.','A veces esperar ayuda.'],
      envido:['¿Envido?','Bueno… juguemos los tantos.','Tengo algo.','Si vos querés, Envido.','No parece peligroso.'],
      truco:['Truco.','Vamos a probar. Truco.','¿Te animás? Truco.','Bueno, subamos un poquito.'],
      retruco:['Ah… ¿querías jugar fuerte? Retruco.','Ahora no te arrepientas. Retruco.','Sigamos entonces: Retruco.'],
      vale4:['Vale Cuatro. Vos llegaste hasta acá.','Yo no te obligué. Vale Cuatro.'],
      quiero:['Quiero.','Sí, querido.','Acepto.','Seguimos.'],
      noQuiero:['No hace falta.','Esta vez te salió.','Guardemos los puntos.'],
      trickWin:['Ajá.','Mirá qué cosa.','Seguimos.'],
      trickLose:['Muy bien.','Interesante.','No te entusiasmes.'],
      tie:['Nadie se lleva nada.','Seguimos igual.'],
      handWin:['Ay querido… te apuraste.','Yo no te obligué a cantar.','Vos solito llegaste hasta acá.','Mordiste el anzuelo.'],
      handLose:['Esta vez no mordiste.','Bueno… aprendiste.','Habrá que tener más paciencia.'],
      matchWin:['La paciencia siempre paga.','Gracias por hacer exactamente lo que esperaba.','Volvé cuando quieras.'],
      matchLose:['Muy bien jugado.','Esta vez me viste venir.','No siempre pesca una.']
    },
    tomi:{
      start:['Tengo unas cartazas… creo.','Hoy vine honesto.','¿Me creerías si te digo que estoy muerto?','Prometo no mentir.','Bueno, capaz una vez.'],
      envido:['Envido. Tengo una barbaridad.','Envido. Ni preguntes.','¿Cuánto era mucho? Envido.','Te juro que tengo. Envido.','Envido con confianza.'],
      truco:['¡TRUCO!','Tengo todo. Truco.','Creeme: Truco.','Esto es completamente legítimo. Truco.','No hay ningún motivo para dudar: Truco.'],
      retruco:['RETRUCO. Ahora sí te digo la verdad.','¿No me creíste? Retruco.','Duplicamos la mentira: Retruco.'],
      vale4:['VALE CUATRO. Esta sí que es posta.','Bueno, hasta acá llegó el acting. Vale Cuatro.','Confiá en mí por una vez: Vale Cuatro.'],
      quiero:['Quiero.','Obvio que quiero.','Esto salió exactamente como planeé.'],
      noQuiero:['Era para probarte.','No necesitaba esos puntos.','Estaba testeando tu reacción.'],
      trickWin:['¿Viste que era verdad?','O capaz tuve suerte.','Te estás confundiendo.'],
      trickLose:['Perfectamente calculado.','Eso formaba parte del plan.','Necesitaba perder esa.'],
      tie:['¿Ves? Ni las cartas saben.','Más confusión. Excelente.'],
      handWin:['Te comiste todo el acting.','No sabés si mentí todavía.','Hermoso. Absolutamente hermoso.'],
      handLose:['Esa mentira salió mal.','Bueno, estadísticamente tenía que pasar.','Era una mentira experimental.'],
      matchWin:['Gracias por creerme.','O por no creerme. Ya no sé.','Te mentí hasta en el saludo.'],
      matchLose:['Te dejé ganar para confundirte.','Todo según el plan.','¿Partida? Pensé que estábamos practicando.']
    },
    raul:{
      start:['Primero Truco, después cantamos.','Qué linda noche para perder puntos.','Afiná esas cartas.','Se abre el telón.','Espero que hayas venido con oído.'],
      envido:['Y ya que estamos… Envido.','Vamos con los tantos.','Una nota más: Envido.','Cantemos los números.'],
      truco:['Truco, maestro.','Subime el volumen: Truco.','Que se escuche ese Truco.','¡TRUCO! En tono mayor.'],
      retruco:['RETRUCO, segunda estrofa.','Vamos al estribillo: Retruco.','Ahora sí estamos cantando. Retruco.'],
      vale4:['VALE CUATRO. Gran final.','Última función: Vale Cuatro.'],
      quiero:['Quiero, maestro.','Que siga la música.','Dale, continuamos.'],
      noQuiero:['Bajemos el telón.','Esa canción no me la sé.','Me retiro con dignidad.'],
      trickWin:['¡Gracias, gracias!','Primer aplauso.','Afinadísimo.'],
      trickLose:['Se me fue una nota.','Problemas de sonido.','Todavía queda show.'],
      tie:['Cantamos la misma nota.','Dúo inesperado.'],
      handWin:['Otra función completa.','Esta mesa tiene dueño.','El público está de pie.'],
      handLose:['El público pidió revancha.','Estaba calentando la voz.','Una desafinación.'],
      matchWin:['Gracias, no hace falta aplaudir.','Excelente público.','Nos vemos en la próxima función.'],
      matchLose:['Hoy la estrella eras vos.','Me robaste el escenario.','Habrá segunda función.']
    },
    vicky:{
      start:['Dale, arrancá.','Esto sale andando o lo arreglamos.','No me hagas perder tiempo.','Motor en marcha.','A ver qué falla primero.'],
      envido:['Envido.','Revisemos los números. Envido.','Tengo buena compresión. Envido.','A ver cuánto marca: Envido.'],
      truco:['TRUCO.','Apretamos un poquito: Truco.','Subimos presión. Truco.','Ahora trabaja el motor: Truco.'],
      retruco:['RETRUCO.','Más torque: Retruco.','Ahora sí estamos hablando. Retruco.'],
      vale4:['VALE CUATRO.','A fondo hasta que rompa.','Último ajuste: Vale Cuatro.'],
      quiero:['Quiero.','Dale.','Está dentro de tolerancia.'],
      noQuiero:['Eso ya es romper por romper.','No vale arreglarlo después.','Cortamos acá.'],
      trickWin:['Quedaste regulando.','Buen ajuste.','Funciona perfecto.'],
      trickLose:['Algo está flojo.','Hay que calibrar.','Después lo reviso.'],
      tie:['Misma presión.','Empate de fábrica.'],
      handWin:['Necesitás service.','Te faltó aceite.','Quedaste en tres cilindros.'],
      handLose:['Algo está fallando.','Tengo que revisar estas cartas.','Debe ser la distribución.'],
      matchWin:['Listo. Trabajo terminado.','Te dejo el presupuesto.','Volvé en diez mil kilómetros.'],
      matchLose:['Bueno, entró al taller.','Hay que cambiar algunas piezas.','La revancha viene con service completo.']
    },
    dante:{
      start:['Nosotros ya jugamos antes… ¿no?','Qué lindas cartas te tocaron.','Esa cara me cuenta bastante.','No te preocupes. Yo tampoco confiaría en mí.','Empezá tranquilo.'],
      envido:['Tengo… suficiente.','Envido. Con confianza.','¿Querés saber cuánto tengo? Envido.','Envido. No mires mi cara.','Los tantos son una cuestión de perspectiva.'],
      truco:['Truco.','No hace falta que aceptes. Truco.','Yo que vos lo pensaría. Truco.','Truco… aunque capaz no conviene.','¿Seguro que querés saber? Truco.'],
      retruco:['Retruco.','Esto se está poniendo divertido. Retruco.','Ahora ya invertiste demasiado para irte. Retruco.'],
      vale4:['Vale Cuatro.','Última oportunidad para desconfiar.','¿Hasta dónde llega tu curiosidad? Vale Cuatro.'],
      quiero:['Quiero.','Me sirve.','Exactamente lo que esperaba.','Seguimos.'],
      noQuiero:['No hoy.','Quedate con esos puntos.','Ya aprendí lo que necesitaba.'],
      trickWin:['Interesante.','Eso salió bien.','¿Qué pensás que tengo ahora?'],
      trickLose:['También sirve.','Información.','Perfecto.'],
      tie:['Qué conveniente.','Ahora se pone mejor.'],
      handWin:['Te avisé.','El problema fue creerme.','O no creerme.','Ahora ya dudás de todo.'],
      handLose:['Interesante.','Ahora ya sé cómo jugás.','Era información que necesitaba.','Perder también enseña.'],
      matchWin:['Nunca supiste cuándo mentía.','Hasta la próxima.','La próxima ya voy a conocerte mejor.'],
      matchLose:['Ahora sí tengo toda la información.','La revancha va a ser distinta.','Muy bien. Me sorprendiste.']
    },
    chiqui:{
      start:['Bueno, organizamos esto rápido.','Tres cartas… lindo número.','¿Y si hacemos dos partidos?','Primero definamos el formato.','¿Esto tiene fase de grupos?'],
      envido:['Bueno… Envido.','Esto estaba aprobado: Envido.','Los tantos están homologados.','Envido, salvo modificación del reglamento.'],
      truco:['Bueno… Truco.','Truco, por decisión organizativa.','Esto entra en el calendario. Truco.','Subimos una categoría: Truco.'],
      retruco:['Retruco… pará que lo acomodo.','Esto requiere otra copa. Retruco.','Retruco, excepcionalmente.'],
      vale4:['Vale Cuatro. Después vemos cómo se computa.','¿Y si mejor hacemos dos Vale Cuatro de dos?'],
      quiero:['Quiero.','Aprobado.','Queda oficializado.','Sí, entra en reglamento.'],
      noQuiero:['No estaba contemplado.','Eso va para la próxima temporada.','Hay que reformular.'],
      trickWin:['Perfecto, sigue el cronograma.','Todo organizado.','Una fecha menos.'],
      trickLose:['Hay que cambiar el formato.','Esto requiere una comisión.','Revisemos el fixture.'],
      tie:['Excelente. Dos grupos iguales.','Así me gusta: bien repartido.'],
      special:['Un segundo que me tienen que secar la nuca.','Pará, pará… la nuca primero.','Con este formato transpira cualquiera.'],
      handWin:['Todo según lo planificado.','Ahora armamos otra copa.','Te toca la fecha interzonal.','La organización fue impecable.'],
      handLose:['Hay que reformular el torneo.','Esto con dos grupos de 15 no pasaba.','Claramente faltaba una fase adicional.'],
      matchWin:['Excelente. Ahora jugamos la Superfinal.','Terminó esta copa. Mañana arranca otra.','Felicitaciones por participar de la estructura.'],
      matchLose:['No pasa nada, inventamos otra copa.','Esto se define en el próximo torneo.','Quedate tranquilo, todavía quedan seis competencias.']
    },
    cristina:{
      start:['Bueno Alberto, mirá cómo se hace.','Espero que esto no dure hasta mañana.','Empezamos cuando quieras.','Hoy vengo con un modelo de juego distinto.','Preparáte porque tengo mucho para explicar.'],
      envido:['Envido.','Los números me dan perfecto.','No preguntes cómo llegué al resultado.','Tengo excelentes indicadores. Envido.','Envido. Los números están clarísimos.'],
      truco:['Truco.','Aceptalo, no seas gorila.','Vamos a profundizar el modelo. Truco.','Truco para todos y todas.','Subamos la apuesta: Truco.'],
      retruco:['Retruco.','Profundizamos: Retruco.','Duplicamos el modelo.','Ahora sí vamos por todo. Retruco.'],
      vale4:['Vale Cuatro.','Esto es una decisión histórica.','Vamos por una victoria contundente. Vale Cuatro.'],
      quiero:['Quiero.','Por supuesto.','Aprobado por amplia mayoría.','La mesa acompaña.'],
      noQuiero:['No convalido esa apuesta.','Me retiro por razones políticas.','No están dadas las condiciones.'],
      trickWin:['Victoria contundente.','Los números hablan solos.','Era evidente.','El pueblo de la mesa acompañó.'],
      trickLose:['La culpa es de Macri.','Esto viene de la gestión anterior.','Claramente hubo condicionamientos externos.','Hay poderes que no quieren que gane esta baza.'],
      tie:['Empate técnico.','Los resultados todavía están en discusión.'],
      handWin:['Victoria histórica.','El pueblo de esta mesa ha hablado.','Como siempre, teníamos razón.','Modelo exitoso.'],
      handLose:['Resultado absolutamente discutible.','Voy a revisar el escrutinio.','Esto no refleja la voluntad de la mesa.','Hubo factores externos.','Ganaste la mano, no el relato.'],
      matchWin:['Victoria histórica del proyecto.','Quedó demostrado quién tenía razón.','Alberto, anotá esta.','Otra página gloriosa en la historia del Truco.'],
      matchLose:['Ganaste en puntos, que no es exactamente lo mismo que ganar.','Este resultado merece una investigación.','Yo contabilizo una victoria conceptual.','El marcador es apenas una interpretación.','Igual la culpa es de Macri.']
    }
  };

  function createMemory(){return {lastPhrase:{},player:{trucoWant:0,trucoNo:0,envidoWant:0,envidoNo:0,raises:0},considered:{hand:0,envido:false,trucoLevel:0},specialShown:false};}
  function resetHandMemory(mem,handNumber){if(mem.considered.hand!==handNumber){mem.considered={hand:handNumber,envido:false,trucoLevel:0};mem.specialShown=false;}}
  function phrase(botId,event,mem){
    const arr=P[botId]?.[event];if(!arr?.length)return '';
    const last=mem?.lastPhrase?.[event];let choices=arr.length>1?arr.filter(x=>x!==last):arr;
    const text=pick(choices);if(mem){mem.lastPhrase=mem.lastPhrase||{};mem.lastPhrase[event]=text;}return text;
  }
  function phraseProbability(event){
    if(event==='start'||event==='matchWin'||event==='matchLose')return 1;
    if(['envido','truco','retruco','vale4'].includes(event))return .68;
    if(['quiero','noQuiero'].includes(event))return .48;
    if(['handWin','handLose'].includes(event))return .58;
    if(['trickWin','trickLose','tie'].includes(event))return .24;
    if(event==='special')return .09;
    return .4;
  }
  function maybePhrase(botId,event,mem,force=false){return (force||chance(phraseProbability(event)))?phrase(botId,event,mem):'';}

  function handStrength(hand){
    const ps=hand.map(Core.power).sort((a,b)=>b-a);
    if(!ps.length)return 0;
    const weights=[.52,.31,.17];let total=0;for(let i=0;i<ps.length;i++)total+=(ps[i]/14)*(weights[i]||0);
    return clamp(total);
  }
  function trickContext(g,botId){
    const hist=g.history||[];let won=0,lost=0,ties=0;for(const h of hist){if(h.winner===botId)won++;else if(!h.winner)ties++;else lost++;}
    return {won,lost,ties,delta:won-lost};
  }
  function seat(bot){return bot.seat||bot.id;}
  function personality(bot,g,mem){
    let liar=bot.stats.mentiroso/100,fish=bot.stats.pescador/100,agg=bot.stats.agresivo/100;
    const id=seat(bot),me=g.score[id]||0, oppId=Core.other(g,id), opp=g.score[oppId]||0;
    if(bot.trait==='impulsive'&&opp-me>=5){agg=clamp(agg+.10);liar=clamp(liar+.08);}
    if(bot.trait==='adaptive'){
      const p=mem.player||{};const total=(p.trucoWant||0)+(p.trucoNo||0);
      if(total>=2){const reject=(p.trucoNo||0)/total;liar=clamp(liar+(reject-.45)*.45);agg=clamp(agg+((p.trucoWant||0)/total-.55)*.18);}
    }
    return {liar,fish,agg};
  }
  function randJitter(scale=.08){return (Math.random()-.5)*2*scale;}

  // --- Lectura de mesa sin hacer trampa ---
  // La IA usa solamente sus cartas y lo que ya quedó visible sobre la mesa.
  function fullDeck(){const d=[];for(const suit of Core.SUITS)for(const value of Core.VALUES)d.push({suit,value,id:`${value}_${suit}`});return d;}
  function visibleIds(g,id){
    const ids=new Set(),me=g.players[id];if(me)for(const c of [...me.hand,...me.played])ids.add(c.id);
    for(const oid of g.order||[]){if(oid===id)continue;for(const c of g.players[oid]?.played||[])ids.add(c.id);}
    return ids;
  }
  function unknownPool(g,id){const seen=visibleIds(g,id);return fullDeck().filter(c=>!seen.has(c.id));}
  function safeClone(g){return JSON.parse(JSON.stringify(g));}
  function cardVsUnknown(g,id,card){
    const pool=unknownPool(g,id);if(!pool.length)return .5;const p=Core.power(card);let score=0;
    for(const c of pool){const op=Core.power(c);if(p>op)score+=1;else if(p===op)score+=.5;}
    return score/pool.length;
  }
  function exactResponseToVisibleCard(g,id){
    const opp=Core.other(g,id),oppCard=opp?g.table[opp]:null;if(g.turn!==id||!oppCard||g.table[id])return null;
    const hand=g.players[id]?.hand||[];if(!hand.length)return 0;let best=-1;
    for(const c of hand){const cg=safeClone(g);if(cg.truco?.pending){cg.truco.pending=null;cg.truco.by=null;cg.truco.byTeam=null;}if(cg.envido?.pending){cg.envido.pending=false;cg.envido.by=null;cg.envido.byTeam=null;}
      const r=Core.playCard(cg,id,c.id);if(!r?.ok)continue;
      if(r.handEnded){best=Math.max(best,r.handWinner===id?1:0);continue;}
      if(r.trickResolved){let v=r.trickWinner===id?.78:!r.trickWinner?.58:.22;v+=handStrength(cg.players[id]?.hand||[])*.16;best=Math.max(best,clamp(v));}
      else best=Math.max(best,.5);
    }
    return best<0?null:best;
  }
  function estimateTrucoEquity(g,id){
    const exact=exactResponseToVisibleCard(g,id);if(exact!==null)return exact;
    const hand=g.players[id]?.hand||[];if(!hand.length)return .02;
    const ctx=trickContext(g,id),hist=g.history||[],opp=Core.other(g,id),myTable=g.table[id]||null;
    let eq=.20+handStrength(hand)*.66;
    if(hist.length===1){const h=hist[0];if(h.winner===id)eq+=.17;else if(h.winner)eq-=.20;else eq-=.02;}
    else if(hist.length>=2){eq=.12+handStrength(hand)*.74;if(ctx.delta>0)eq+=.20;else if(ctx.delta<0)eq-=.22;}
    if(myTable&&g.turn===opp){const hold=cardVsUnknown(g,id,myTable);eq=eq*.55+hold*.45;}
    if(hist.length===2&&hand.length===1)eq=cardVsUnknown(g,id,hand[0]);
    return clamp(eq,.01,.99);
  }
  function estimateEnvidoEquity(g,id){
    const pts=Core.envido(Core.allCards(g,id));let eq=pts>=33?.995:pts===32?.97:pts===31?.93:pts===30?.87:pts===29?.79:pts===28?.69:pts===27?.59:pts===26?.49:pts===25?.40:pts===24?.32:pts===23?.25:pts===22?.19:pts===21?.14:.09;
    if(g.mano===id)eq+=.025;return clamp(eq,.03,.997);
  }
  function scorePressure(g,id){
    const opp=Core.other(g,id),mine=g.score[id]||0,theirs=g.score[opp]||0,target=g.targetScore||15;
    return {mine,theirs,target,behind:theirs-mine,oppClose:target-theirs,mineClose:target-mine};
  }

  function decideInitialEnvido(g,bot,mem){
    const actions=Core.getActions(g,seat(bot));if(!actions.envidoCalls.length)return null;
    resetHandMemory(mem,g.handNumber);if(mem.considered.envido)return null;mem.considered.envido=true;
    const id=seat(bot),pts=Core.envido(Core.allCards(g,id)),eq=estimateEnvidoEquity(g,id),{liar,fish,agg}=personality(bot,g,mem),sp=scorePressure(g,id);
    let p=.03+eq*.58+agg*.13+liar*(1-eq)*.16-fish*.10;
    if(pts>=30)p+=.16;else if(pts<=22)p-=.14;
    if(bot.trait==='fisher'&&pts>=29)p-=.16;if(bot.trait==='trap'&&pts>=30)p-=.10;if(bot.trait==='frontal'&&pts>=27)p+=.10;
    if(bot.trait==='chaotic')p+=randJitter(.12);if(bot.trait==='conservative')p-=.20;
    if(!chance(p))return null;
    const foldy=(mem.player.envidoNo||0)/Math.max(1,(mem.player.envidoNo||0)+(mem.player.envidoWant||0));
    if(actions.envidoCalls.includes('falta')&&(pts>=31||((liar>.82&&foldy>.55)))&&(sp.behind>=3||sp.mineClose<=4)&&chance(.12+agg*.12+eq*.18))return 'falta';
    if(actions.envidoCalls.includes('real')&&(pts>=29||(liar>.78&&foldy>.55))&&chance(.14+agg*.12+eq*.18))return 'real';
    return 'envido';
  }

  function decideEnvidoResponse(g,bot,mem){
    const id=seat(bot),actions=Core.getActions(g,id);if(!actions.canRespondEnvido)return null;
    const pts=Core.envido(Core.allCards(g,id)),eq=estimateEnvidoEquity(g,id),{liar,fish,agg}=personality(bot,g,mem),sp=scorePressure(g,id),chain=g.envido.chain||[];
    const accepted=Core.acceptedEnvidoValue(g,chain),before=chain.slice(0,-1),reject=before.length?Core.acceptedEnvidoValue(g,before):1;
    let required=.46+(accepted>=5?.07:0)+(accepted>=8?.07:0)+fish*.025-agg*.035;
    if(sp.theirs+reject>=sp.target)required-=.14;if(sp.mine-sp.theirs>=6)required+=.04;
    let accept=eq>=required;
    if(!accept&&eq>required-.08&&chance(.18+agg*.18))accept=true;
    const raises=actions.envidoRaises||[],foldy=(mem.player.envidoNo||0)/Math.max(1,(mem.player.envidoNo||0)+(mem.player.envidoWant||0));
    if(raises.length){
      let raise=false;if(eq>.76)raise=chance(.35+agg*.30);else if(eq>.62)raise=chance(.12+agg*.18);else if(liar>.78&&foldy>.5)raise=chance((liar-.7)*.28);
      if(bot.trait==='conservative')raise=false;
      if(raise){if(raises.includes('falta')&&(pts>=31||(liar>.9&&foldy>.62))&&chance(.28+eq*.28))return {type:'raise',call:'falta'};if(raises.includes('real')&&(pts>=28||eq>.68||liar>.82))return {type:'raise',call:'real'};if(raises.includes('envido'))return {type:'raise',call:'envido'};}
    }
    return {type:accept?'want':'no'};
  }

  function decideInitialTruco(g,bot,mem){
    const id=seat(bot),actions=Core.getActions(g,id);if(!actions.trucoCall)return false;
    resetHandMemory(mem,g.handNumber);const lvl=g.truco.level;if(mem.considered.trucoLevel===lvl)return false;mem.considered.trucoLevel=lvl;
    const eq=estimateTrucoEquity(g,id),{liar,fish,agg}=personality(bot,g,mem),sp=scorePressure(g,id),foldy=(mem.player.trucoNo||0)/Math.max(1,(mem.player.trucoNo||0)+(mem.player.trucoWant||0));
    let p=eq>=.78?.88:eq>=.64?.70:eq>=.54?.50:eq>=.44?.30:eq>=.32?.14:.035;
    p+=agg*.14-fish*.07+liar*(1-eq)*.07;
    if(lvl===2)p-=.06;if(lvl===3)p-=.12;
    if(bot.trait==='frontal')p+=eq>=.18?.12:-.13;
    if(bot.trait==='fisher')p-=.09;if(bot.trait==='trap'&&eq>.72)p-=.08;
    if(bot.trait==='impulsive')p+=.07;if(bot.trait==='chaotic')p+=randJitter(.10);if(bot.trait==='conservative')p-=.20;
    if(eq<.06){p=liar*(.025+.055*foldy);if(bot.trait==='deceptive'||bot.trait==='chaotic'||bot.trait==='adaptive')p+=liar*.025;if(bot.trait==='frontal'||bot.trait==='conservative')p*=.25;}
    if(sp.behind>=6)p+=agg*.05;
    return chance(p);
  }

  function decideTrucoResponse(g,bot,mem){
    const id=seat(bot),actions=Core.getActions(g,id);if(!actions.canRespondTruco)return null;
    const proposed=g.truco.pending||2,current=g.truco.level||1,eq=estimateTrucoEquity(g,id),{liar,fish,agg}=personality(bot,g,mem),sp=scorePressure(g,id);
    // Umbral de EV + colchón humano: aceptar Vale 4 no depende solo de tener una carta alta,
    // sino de la probabilidad real de cerrar la mano desde la posición actual.
    const humanBase=proposed===4?.56:proposed===3?.47:.39;
    let required=humanBase+fish*.055-agg*.085;
    if(bot.trait==='conservative')required+=.09;if(bot.trait==='frontal')required-=.025;if(bot.trait==='impulsive')required-=.035;
    if(sp.theirs+current>=sp.target)required-=.12;if(sp.mine-sp.theirs>=6)required+=.04;
    required=clamp(required,.25,.70);
    const canAccept=eq>=required||(eq>=required-.06&&chance(.16+agg*.15));
    const foldy=(mem.player.trucoNo||0)/Math.max(1,(mem.player.trucoNo||0)+(mem.player.trucoWant||0));
    if(actions.canCounterTruco){
      const next=proposed+1;let raiseNeed=next===4?.64:.58;raiseNeed+=fish*.035-agg*.07;
      let raise=eq>=raiseNeed&&chance(.28+agg*.46+(eq-raiseNeed)*.6);
      if(!raise&&eq<.12&&liar>.72&&foldy>.48)raise=chance((liar-.65)*(.10+.16*foldy));
      if(bot.trait==='frontal'&&eq>.55)raise=raise||chance(.18);if(bot.trait==='conservative')raise=false;
      if(raise)return 'raise';
    }
    // Con una mano matemáticamente muerta no "quiere" por personalidad: acepta solo si
    // existe una chance real. Mentir sirve para cantar/subir, no para regalar puntos.
    if(eq<.035)return 'no';
    return canAccept?'want':'no';
  }

  function chooseCard(g,bot,mem){
    const id=seat(bot),hand=[...g.players[id].hand];if(!hand.length)return null;
    const opp=Core.other(g,id),oppCard=opp?g.table[opp]:null,asc=[...hand].sort((a,b)=>Core.power(a)-Core.power(b)),desc=[...asc].reverse(),trait=bot.trait;
    if(oppCard){
      // Probar cada carta con las reglas reales permite detectar pardas, tercera baza y
      // manos ya ganadas/perdidas. Siempre prioriza cerrar la mano con la carta más barata.
      const evals=asc.map(c=>{const cg=safeClone(g);const r=Core.playCard(cg,id,c.id);let score=0;if(r?.handEnded)score=r.handWinner===id?1000:-1000;else if(r?.trickResolved)score=r.trickWinner===id?120:!r.trickWinner?65:-120;score-=Core.power(c)*.7;return {c,score,r};});
      const best=Math.max(...evals.map(x=>x.score)),bestCards=evals.filter(x=>x.score===best);
      if(best<=-900)return asc[0];return bestCards[0].c;
    }
    const ctx=trickContext(g,id),round=(g.history||[]).length;
    if(round>=2)return desc[0];
    if(round===1){const h=g.history[0];if(!h.winner||h.winner!==id)return desc[0];return asc[0];}
    if(trait==='fisher'||trait==='trap'||trait==='deceptive')return asc[0];
    if(trait==='frontal')return Core.power(desc[0])>=12?desc[0]:asc[Math.min(1,asc.length-1)];
    if(trait==='efficient')return asc[Math.min(1,asc.length-1)];
    if(trait==='impulsive')return chance(.30)?desc[0]:asc[Math.min(1,asc.length-1)];
    if(trait==='chaotic')return chance(.22)?pick(hand):asc[Math.min(1,asc.length-1)];
    if(trait==='conservative')return asc[0];
    if(trait==='adaptive'){const total=(mem.player.trucoWant||0)+(mem.player.trucoNo||0),brave=total?(mem.player.trucoWant||0)/total:.5;return brave>.65?asc[0]:asc[Math.min(1,asc.length-1)];}
    return asc[Math.min(1,asc.length-1)];
  }

  function recordPlayer(mem,event){
    if(!mem?.player)return;
    if(event==='trucoWant')mem.player.trucoWant++;
    else if(event==='trucoNo')mem.player.trucoNo++;
    else if(event==='envidoWant')mem.player.envidoWant++;
    else if(event==='envidoNo')mem.player.envidoNo++;
    else if(event==='raise')mem.player.raises++;
  }

  return {BOTS,BOT_ORDER,P,createMemory,resetHandMemory,phrase,maybePhrase,handStrength,decideInitialEnvido,decideEnvidoResponse,decideInitialTruco,decideTrucoResponse,chooseCard,recordPlayer};
});
