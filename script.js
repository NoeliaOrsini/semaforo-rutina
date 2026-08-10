window.addEventListener('error', function(ev){
  const banner = document.getElementById('errorBanner');
  if(banner){
    banner.style.display = 'block';
    banner.textContent = '⚠️ Ocurrió un error en la app: ' + ev.message + ' (línea ' + ev.lineno + ')';
  }
});

(function(){

  function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if(!container) return;
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  function showConfirmModal(onConfirm) {
    const modal = document.getElementById('confirmModal');
    const cancelBtn = document.getElementById('confirmCancelBtn');
    const okBtn = document.getElementById('confirmOkBtn');
    if(!modal) return;

    modal.classList.add('active');

    const closeModal = () => {
      modal.classList.remove('active');
      cancelBtn.removeEventListener('click', handleCancel);
      okBtn.removeEventListener('click', handleOk);
    };

    const handleCancel = () => closeModal();
    const handleOk = () => {
      closeModal();
      onConfirm();
    };

    cancelBtn.addEventListener('click', handleCancel);
    okBtn.addEventListener('click', handleOk);
  }

  const CATEGORIES = [
    {
      id:'emociones', icon:'💛', label:'Emociones',
      options:[
        {value:'green', text:'Calmo / En equilibrio'},
        {value:'yellow', text:'Con altibajos / Cansado'},
        {value:'red', text:'Abrumado / Desbordado'}
      ]
    },
    {
      id:'actividad', icon:'🏃', label:'Actividad Física',
      options:[
        {value:'green', text:'Entrené / Moví el cuerpo'},
        {value:'yellow', text:'Caminé un poco / Leve'},
        {value:'red', text:'Completamente sedentario'}
      ]
    },
    {
      id:'descanso', icon:'😴', label:'Descanso / Dormir',
      options:[
        {value:'green', text:'Más de 8 horas / Reparador'},
        {value:'yellow', text:'Entre 6 y 7 horas'},
        {value:'red', text:'Menos de 6 horas / Insomnio'}
      ]
    },
    {
      id:'trabajo', icon:'💼', label:'Trabajo',
      options:[
        {value:'green', text:'Jornada equilibrada de 8 hrs'},
        {value:'yellow', text:'Trabajo intenso / 9-10 hrs'},
        {value:'red', text:'Sobrecargado / Más de 10 hrs'},
        {value:'white', text:'No trabajo / Estoy en la búsqueda / Estudio'}
      ]
    },
    {
      id:'estudio', icon:'📚', label:'Estudio',
      options:[
        {value:'green', text:'Muy productivo / Avancé firme'},
        {value:'yellow', text:'Sostenido / Hice lo que pude'},
        {value:'red', text:'Estancado / Sin foco'},
        {value:'white', text:'No estudio / No aplica'}
      ]
    },
    {
      id:'esparcimiento', icon:'🌿', label:'Esparcimiento',
      options:[
        {value:'green', text:'Tuve disfrute / Ocio'},
        {value:'yellow', text:'Poco tiempo para mí'},
        {value:'red', text:'Nada de tiempo'}
      ]
    },
    {
      id:'alimentacion', icon:'🍽️', label:'Alimentación',
      options:[
        {value:'green', text:'Sana / Consciente / Casera'},
        {value:'yellow', text:'A las apuradas / Procesada'},
        {value:'red', text:'Chatarra / Descuidada'}
      ]
    }
  ];

  const STORAGE_KEY = 'semaforoRutinaHistorial';

  const categoriesWrap = document.getElementById('categoriesWrap');
  const form = document.getElementById('routineForm');
  const resultsEl = document.getElementById('results');
  const historyList = document.getElementById('historyList');
  const clearHistoryBtn = document.getElementById('clearHistoryBtn');
  const downloadHistoryBtn = document.getElementById('downloadHistoryBtn');

  CATEGORIES.forEach(cat=>{
    const card = document.createElement('div');
    card.className = 'cat-card';
    card.dataset.catId = cat.id;

    const title = document.createElement('div');
    title.className = 'cat-title';
    title.innerHTML = `<span class="cat-icon">${cat.icon}</span><span>${cat.label}</span>`;
    card.appendChild(title);

    const optionsWrap = document.createElement('div');
    optionsWrap.className = 'options';

    cat.options.forEach((opt)=>{
      const label = document.createElement('label');
      label.className = 'option';
      label.dataset.value = opt.value;

      const input = document.createElement('input');
      input.type = 'radio';
      input.name = cat.id;
      input.value = opt.value;

      const dot = document.createElement('span');
      dot.className = 'dot';

      const text = document.createElement('span');
      text.textContent = opt.text;

      label.appendChild(input);
      label.appendChild(dot);
      label.appendChild(text);
      optionsWrap.appendChild(label);

      input.addEventListener('change', ()=>{
        optionsWrap.querySelectorAll('.option').forEach(o=>{
          o.classList.remove('sel-green','sel-yellow','sel-red','sel-white');
        });
        label.classList.add('sel-'+opt.value);
        card.classList.remove('missing');
      });
    });

    card.appendChild(optionsWrap);
    categoriesWrap.appendChild(card);
  });

  function updateTrafficLight(counts){
    const bulbRed = document.getElementById('bulbRed');
    const bulbYellow = document.getElementById('bulbYellow');
    const bulbGreen = document.getElementById('bulbGreen');
    [bulbRed,bulbYellow,bulbGreen].forEach(b=>b && b.classList.remove('on'));

    const lightLabel = document.getElementById('lightLabel');
    let result;

    if((counts.red >= 1 && counts.yellow >= 1) || counts.red >= 3){
      bulbRed && bulbRed.classList.add('on');
      result = 'ROJO';
    } 
    else if(counts.red >= 1 || counts.yellow >= 1){
      bulbYellow && bulbYellow.classList.add('on');
      result = 'AMARILLO';
    } 
    else {
      bulbGreen && bulbGreen.classList.add('on');
      result = 'VERDE';
    }

    if(lightLabel) lightLabel.textContent = result;
    return result;
  }

  const REFLECTIONS = {
    emociones:{
      icon:'💛', label:'Emociones',
      green:[
        'Estás calmo y en equilibrio. Reconocé qué hiciste distinto hoy y tratá de sostenerlo: esa calma es un logro, no una casualidad.',
        'Aprovechá este estado para planificar algo lindo para los próximos días.'
      ],
      yellow:[
        'Los altibajos son parte de ser humano. Hoy puede ayudar hacer una pausa breve, respirar profundo o anotar lo que sentís sin juzgarte.',
        'Escribir 2-3 líneas sobre lo que sentiste te puede ayudar a ordenar el día.',
        'Hablar con alguien de confianza sobre cómo te sentiste también alivia.'
      ],
      red:[
        'Hoy te sentiste desbordado/a. Está bien no estar bien: date permiso para frenar y nombrar qué sentís.',
        'Agarrá una hoja y anote aquellas cosas que le/o hicieron sentir así, para poder tomar conocimiento y ver posibles soluciones.',
        'Probá una respiración profunda y lenta (inhalar 4 segundos, sostener 4, exhalar 6) para bajar la intensidad del momento.',
        'Si esto se repite seguido, hablarlo con un profesional puede aliviar mucho — no hace falta atravesarlo solo/a.'
      ]
    },
    actividad:{
      icon:'🏃', label:'Actividad Física',
      green:[
        '¡Excelente! Moviste el cuerpo y eso nutre tanto la mente como el ánimo. Seguí escuchando lo que tu cuerpo necesita.',
        'Si querés variar, alternar caminata, fuerza y estiramiento a lo largo de la semana suma mucho.'
      ],
      yellow:[
        'Te moviste un poco hoy, y eso ya suma. Para sumar un poco más:',
        'Agregá una caminata de 10 minutos en algún momento del día.',
        'Elegí las escaleras en vez del ascensor cuando puedas.',
        'Si pasás muchas horas frente a la computadora: levantate cada 50 minutos y caminá un par de minutos, o hacé unas rotaciones de hombros para soltar tensión.'
      ],
      red:[
        'Hoy el cuerpo estuvo bastante quieto. No hace falta un entrenamiento intenso, empezar de a poco ya hace diferencia:',
        'Agregá aunque sea 10 minutos de caminata en el día.',
        'Elegí las escaleras en vez del ascensor, o bajate una parada antes del colectivo y caminá el resto.',
        'Si pasás muchas horas frente a la computadora: hacé pausas activas cada 50 minutos y probá una rutina exprés de 5 minutos en casa (sentadillas con apoyo en una silla, flexiones contra la pared, elevar talones).'
      ]
    },
    descanso:{
      icon:'😴', label:'Descanso',
      green:[
        'Un descanso reparador es uno de los pilares más poderosos de la salud. ¡Celebralo y seguí cuidándolo!',
        'Mantené horarios regulares de sueño, incluso los fines de semana, para sostener ese buen descanso.'
      ],
      yellow:[
        'Dormiste un poco menos de lo ideal. Si podés, intentá adelantar 30 minutos la hora de acostarte esta noche.',
        'Evitar pantallas y cafeína en las últimas horas del día ayuda a dormir mejor.'
      ],
      red:[
        '🌙 Higiene del sueño: tu descanso necesita atención. El descanso no es un lujo, es la base de todo lo demás.',
        'Desconectate de las pantallas una hora antes de dormir, cená liviano y buscá un ambiente oscuro y fresco.',
        'Mantené un horario fijo para acostarte y levantarte, incluso los fines de semana.',
        'Evitá la cafeína después del mediodía si te cuesta conciliar el sueño.'
      ]
    },
    trabajo:{
      icon:'💼', label:'Trabajo',
      green:[
        'Una jornada equilibrada es un logro. Seguí protegiendo tus límites laborales cuando sea posible.',
        'Reservá bloques de tiempo sin interrupciones para las tareas que más foco requieren.'
      ],
      yellow:[
        'El trabajo estuvo intenso hoy. Antes de dormir, intentá "cerrar" mentalmente la jornada con una actividad de transición (caminata corta, música, una ducha) para no llevarte la tensión a la cama.',
        'Definí un horario de cierre y avisá si algo queda pendiente para mañana, en vez de estirar la jornada.'
      ],
      red:[
        'Tuviste una jornada laboral muy extensa. Intentá incorporar micro-pausas de 5 minutos cada hora.',
        'Ponete un límite claro al horario de cierre, aunque quede algo pendiente para mañana.',
        'Si esto se repite seguido, puede ser momento de conversar límites con tu equipo o jefe.'
      ],
      white:[
        'Hoy no fue un día de trabajo formal — quizás estás en búsqueda laboral, estudiando o en otra etapa. Ese tiempo también merece estructura y cuidado.',
        'Ponerte una pequeña meta diaria (aunque sea chica) ayuda a sostener el ánimo y la sensación de avance.'
      ]
    },
    estudio:{
      icon:'📚', label:'Estudio',
      green:[
        'Avanzaste con foco. Esa sensación de logro es combustible para seguir. ¡Bien hecho!',
        'Anotá qué te funcionó hoy para repetirlo mañana.'
      ],
      yellow:[
        'Sostuviste el estudio como pudiste, y eso también vale.',
        'Dividir la tarea en bloques cortos con pausas puede ayudarte a recuperar foco mañana.',
        'Probá la técnica Pomodoro: 25 minutos de estudio y 5 de descanso.'
      ],
      red:[
        'El estudio estuvo estancado hoy. Antes de exigirte más, revisá si el descanso, el trabajo o el estado emocional te están restando foco.',
        'Empezá con una tarea chica y fácil para agarrar impulso.',
        'No te exiges retomar todo de golpe: un poco de avance también cuenta.'
      ],
      white:[
        'Hoy no fue un día de estudio formal. Está bien: no todo día tiene que incluir estudiar.',
        'Si en algún momento retomás, una meta chica y clara ayuda a arrancar sin presión.'
      ]
    },
    esparcimiento:{
      icon:'🌿', label:'Esparcimiento',
      green:[
        'Tener tiempo de disfrute es esencial. Ese espacio de ocio te recarga y te hace más presente en todo lo demás.',
        'Seguí reservando ese tiempo en tu semana, es una inversión en vos.'
      ],
      yellow:[
        'Tuviste poco tiempo para vos. Intentá reservar, aunque sea, 15-20 minutos mañana para algo que disfrutes sin culpa.',
        'Hasta una pausa breve para escuchar música o tomar un café tranquilo cuenta como esparcimiento.'
      ],
      red:[
        'Hoy no tuviste nada de tiempo para vos. El ocio no es tiempo perdido, es una necesidad básica más.',
        'Agendá, aunque sea un ratito, algo que disfrutes esta semana, como si fuera una reunión importante.',
        'Si esto se repite seguido y te cuesta encontrar espacio para disfrutar, también puede ayudar hablarlo con un profesional.'
      ]
    },
    alimentacion:{
      icon:'🍽️', label:'Alimentación',
      green:[
        'Sana, consciente y casera. ¡Excelente elección para tu energía y bienestar!',
        'Seguí sosteniendo estos hábitos que tanto bien le hacen a tu organismo.'
      ],
      yellow:[
        'A las apuradas o procesada. Intentá sumar un vaso de agua o una fruta para balancear el día.',
        'Pequeños ajustes pueden devolverte vitalidad.'
      ],
      red:[
        'Chatarra o descuidada. Cada pequeño paso cuenta: empezá por hidratarte bien y sumar un alimento fresco hoy mismo.',
        'Cuidar tu nutrición es cuidar tu motor principal.'
      ]
    }
  };

  function reflectionOptionsToHtml(opts){
    if(!opts || !Array.isArray(opts) || opts.length === 0) return '';
    if(opts.length === 1) return opts[0];
    return opts[0] + '<br>• ' + opts.slice(1).join('<br>• ');
  }

  function buildReflections(selections){
    return Object.keys(REFLECTIONS).map(id=>{
      const cat = REFLECTIONS[id];
      const selValue = selections[id] || 'green';
      const opts = cat[selValue] || cat['green'] || [];
      return `<strong>${cat.icon} ${cat.label}:</strong> ${reflectionOptionsToHtml(opts)}`;
    });
  }

  function buildDailyTip(selections){
    // Prioridad de color: rojo > amarillo > verde > blanco
    const colorPriority = ['red','yellow','green','white'];
    // Prioridad de áreas: sostenimiento → regulación → productivo
    const categoryPriority = [
      'descanso',
      'emociones',
      'alimentacion',
      'actividad',
      'esparcimiento',
      'trabajo',
      'estudio'
    ];
    for(const level of colorPriority){
      for(const id of categoryPriority){
        if(selections[id] === level && REFLECTIONS[id] && REFLECTIONS[id][level] && REFLECTIONS[id][level].length > 0){
          const cat = REFLECTIONS[id];
          return `${cat.icon} ${cat.label}: ${cat[level][0]}`;
        }
      }
    }
    return 'Seguí cuidando tu equilibrio día a día.';
  }
  
    const RECIPES = [
    {
      tag: 'Vianda',
      title: 'Muffins Saludables de Verdura',
      ingredients: [
        '2 huevos',
        '4 cucharadas de leche',
        '1 cucharada de aceite',
        '3 cucharadas colmadas de harina leudante',
        'Sal y queso rallado',
        '1 taza de verdura cocida y escurrida (espinaca, brócoli o zanahoria rallada)'
      ],
      steps: 'Licuar los huevos, la leche, el aceite, la harina, la sal y el queso por 1 minuto. Pasar a un bol e integrar la verdura picada. Volcar en moldes para muffins engrasados y hornear a 180°C por 20 minutos.'
    },
    {
      tag: 'Vianda',
      title: 'Bocaditos Express de Verdura',
      ingredients: [
        '1 taza de puré de calabaza (o papa)',
        '1 taza de espinaca cocida picada',
        '½ taza de choclo o zanahoria rallada',
        '2 huevos',
        '3 cucharadas de queso rallado',
        '2 cucharadas de pan rallado integral (o avena)',
        'Condimentos a gusto'
      ],
      steps: 'Mezclar todos los ingredientes en un bol. Armar bolitas o torrijas con las manos. Colocar en una placa aceitada y dorar al horno o sartén 10 minutos por lado.'
    },
    {
      tag: 'Vianda',
      title: 'Masa Casera y Relleno de Atún',
      ingredients: [
        'Masa: 2 tazas de harina común, 1 cdita. de sal, 4 cdas. de aceite, ½ taza de agua tibia',
        'Relleno: 1 lata de atún, 1 huevo duro picado, 2 cdas. de queso crema, chorrito de puré de tomate'
      ],
      steps: 'Unir los ingredientes de la masa y amasar 2 minutos. Estirar fina. Mezclar los ingredientes del relleno, rellenar (tarta o empanadas) y hornear a fuego fuerte 15-20 minutos.'
    },
    {
      tag: 'Vianda',
      title: 'Terrina Express de Zucchini y Queso',
      ingredients: [
        '2 zucchinis (o zapallitos)',
        '1 cebolla',
        '3 huevos',
        '3 cucharadas de queso crema',
        '4 cucharadas de avena fina (o harina)',
        '100 g de queso cremoso picado',
        'Sal y pimienta'
      ],
      steps: 'Rallar los zucchinis y picar la cebolla; rehogar 5 minutos para sacar el exceso de agua. Batir huevos con queso crema, avena y condimentos. Incorporar vegetales y queso picado. Volcar en budinera aceitada y hornear a 180°C unos 30 minutos hasta que cuaje.'
    },
    {
      tag: 'Dulce',
      title: 'Torta de Naranja en Licuadora',
      ingredients: [
        '1 naranja entera (lavada, sin semillas ni fibras blancas)',
        '3 huevos',
        '½ taza de aceite',
        '1 taza de azúcar',
        '2 tazas de harina leudante',
        '1 cdita. de vainilla'
      ],
      steps: 'Licuar la naranja en trozos con los huevos, el aceite, el azúcar y la vainilla. Pasar a un bol, incorporar la harina tamizada con movimientos suaves y verter en molde enmantecado. Hornear a 180°C durante 35-40 minutos.'
    },
    {
      tag: 'Dulce',
      title: 'Pancakes de Harina Integral',
      ingredients: [
        '1 taza de harina integral',
        '1 huevo',
        '¾ taza de leche (o bebida vegetal)',
        '1 cucharadita de polvo de hornear',
        '1 cucharadita de miel o azúcar mascabo (opcional)',
        'Pizca de sal',
        'Aceite o rocío vegetal para la sartén'
      ],
      steps: 'Mezclar los secos. Batir el huevo con la leche y la miel; unir con la harina sin batir de más. Cocinar por cucharadas en sartén antiadherente a fuego medio, 2-3 minutos por lado. Servir con fruta fresca.'
    },
    {
      tag: 'Dulce',
      title: 'Galletitas de Avena Simples',
      ingredients: [
        '1 taza de avena arrollada',
        '1 banana madura pisada (o 3 cdas. de puré de manzana)',
        '2 cucharadas de aceite o manteca derretida',
        '2 cucharadas de miel o azúcar mascabo',
        'Pizca de canela (opcional)',
        'Puñado de pasas o chips de chocolate (opcional)'
      ],
      steps: 'Mezclar todos los ingredientes hasta formar una masa. Armar galletitas aplastadas en una placa. Hornear a 180°C durante 12-15 minutos hasta que estén doradas en los bordes. Dejar enfriar antes de guardar.'
    }
  ];

  function buildRecipesHtml(){
    return RECIPES.map(r => {
      const ingredientsList = r.ingredients.map(i => `<li>${i}</li>`).join('');
      return `
        <div class="recipe-card">
          <div class="recipe-tag">${r.tag}</div>
          <h4>${r.title}</h4>
          <p class="recipe-label">Ingredientes</p>
          <ul class="recipe-ingredients">${ingredientsList}</ul>
          <p class="recipe-label">Preparación</p>
          <p class="recipe-steps">${r.steps}</p>
        </div>
      `;
    }).join('');
  }
  
  function buildNutrition(selections){
    const nivel = selections.alimentacion || 'green'; 
    const activo = selections.actividad !== 'red';

    const introText = (nivel === 'green'
      ? '¡Vas por muy buen camino! Seguí sosteniendo estos hábitos, que ya te están haciendo bien:'
      : nivel === 'yellow'
      ? 'Vas bien, con pequeños ajustes podés sumar aún más energía a tu día:'
      : 'Cada pequeño cambio cuenta. Empecemos de a poco, sin presión ni todo o nada:')
      + ' No olvides tomar 2 litros de agua por día.';

    const breakfastOptions = [
      'Infusión con leche descremada, una tostada de pan integral con queso magro.',
      'Yogur descremado con avena / cereales y/o frutas.',
      'Tostada de arroz con queso crema descremado y palta, acompañada de fruta fresca a elección (banana, frutillas, uvas, naranja, etc).',
      'Frutas de estación, un huevo y frutos secos.'
    ];

    const snackOptions = [
      'Yogur descremado con cereales, en vez de algo ultraprocesado.',
      'Un puñado de frutos secos con fruta fresca (banana, uvas, frutillas, naranja, etc).',
      'Tostada de arroz con queso crema descremado y palta, acompañada de fruta fresca a elección.'
    ];

    let lunchOptions = [];
    let dinnerOptions = [];

    if(nivel === 'green'){
      lunchOptions = [
        'Una lata de atún al agua con tomates cherry, hojas verdes y 1 fruta.',
        'Una ensalada completa con vegetales variados, proteína y 1 fruta.',
        'Pollo o pescado con guarnición y 1 fruta.'
      ];
      dinnerOptions = [
        'Cena liviana y balanceada (vegetales y proteína magra) + 1 fruta.',
        'Pescado con alguna guarnición + 1 fruta.',
        'Un omelette simple con vegetales + 1 fruta.'
      ];
    } else if(nivel === 'yellow'){
      lunchOptions = [
        'Una lata de atún al agua con tomates cherry, hojas verdes y 1 fruta — práctico y rápido.',
        'Pollo o pescado ya cocido de antes con ensalada simple y 1 fruta.',
        'Una ensalada completa con lo que tengas en la heladera y 1 fruta.'
      ];
      dinnerOptions = [
        'Un omelette simple con vegetales y 1 fruta.',
        'Atún o pescado con ensalada y 1 fruta, evitando que sea la comida más pesada.',
        'Pescado con alguna guarnición liviana y 1 fruta.'
      ];
    } else {
      lunchOptions = [
        'Una lata de atún con tomates cherry, palta y 1 fruta — se arma en minutos sin cocinar.',
        'Un huevo duro con una ensalada rápida y 1 fruta.',
        'Pollo a la plancha o hervido (sin piel) con ensalada y 1 fruta.'
      ];
      dinnerOptions = [
        'Un omelette sencillo o atún con vegetales y 1 fruta.',
        'Una ensalada rápida con huevo duro o queso fresco magro y 1 fruta.',
        'Pollo a la plancha o hervido (sin piel) con ensalada, o pescado con guarnición y 1 fruta.'
      ];
    }

    if(activo){
      lunchOptions[0] += ' Como te moviste hoy, asegurate de hidratarte bien.';
    }

    return {
      intro: introText,
      meals: {
        desayuno: '• ' + breakfastOptions.join('<br>• '),
        almuerzo: '• ' + lunchOptions.join('<br>• '),
        merienda: '• ' + snackOptions.join('<br>• '),
        cena: '• ' + dinnerOptions.join('<br>• ')
      }
    };
  }

  let memoryHistory = null;

  function getHistory(){
    if(memoryHistory !== null) return memoryHistory;
    try{
      const data = localStorage.getItem(STORAGE_KEY);
      memoryHistory = data ? JSON.parse(data) : [];
    }catch(e){
      memoryHistory = [];
    }
    return memoryHistory;
  }

  function saveHistory(history){
    memoryHistory = history;
    try{
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    }catch(e){}
  }

  function renderHistory(){
    const hist = getHistory();
    historyList.innerHTML = '';

    if(hist.length === 0){
      historyList.innerHTML = '<div class="empty-history">Aún no hay días guardados. Evaluá tu día arriba para comenzar tu historial.</div>';
      return;
    }

    hist.forEach((entry)=>{
      const item = document.createElement('div');
      item.className = 'history-item';

      const dateSpan = document.createElement('div');
      dateSpan.className = 'history-date';
      dateSpan.textContent = entry.dateFormatted;

      const dotsDiv = document.createElement('div');
      dotsDiv.className = 'history-dots';

      const catKeys = ['emociones','actividad','descanso','trabajo','estudio','esparcimiento','alimentacion'];
      catKeys.forEach(k=>{
        const val = (entry.selections && entry.selections[k]) ? entry.selections[k] : 'white';
        const d = document.createElement('span');
        d.className = 'dot-' + (val === 'white' ? 'white' : val);
        d.title = k + ': ' + val;
        dotsDiv.appendChild(d);
      });

      item.appendChild(dateSpan);
      item.appendChild(dotsDiv);
      historyList.appendChild(item);
    });
  }

  form.addEventListener('submit', (e)=>{
    e.preventDefault();

    let missing = false;
    const selections = {};
    const counts = {green:0, yellow:0, red:0, white:0};

    CATEGORIES.forEach(cat=>{
      const card = categoriesWrap.querySelector(`[data-cat-id="${cat.id}"]`);
      const checked = card ? card.querySelector(`input[name="${cat.id}"]:checked`) : null;
      if(!checked){
        missing = true;
        if(card) card.classList.add('missing');
      } else {
        if(card) card.classList.remove('missing');
        selections[cat.id] = checked.value;
        counts[checked.value] = (counts[checked.value] || 0) + 1;
      }
    });

    if(missing){
      showToast('Por favor, seleccioná una opción en cada una de las 7 categorías antes de evaluar.', 'error');
      return;
    }

    const resultColor = updateTrafficLight(counts);

    const reflectionsHtml = buildReflections(selections).map(r => `<div class="reflection">${r}</div>`).join('');
    const nutritionObj = buildNutrition(selections);
    const dailyTip = buildDailyTip(selections);

    resultsEl.innerHTML = `
      <h2>🌱 Tu evaluación de hoy</h2>
      <div class="eval-summary-counts">
        🟢 ${counts.green || 0} en equilibrio &nbsp;·&nbsp; 🟡 ${counts.yellow || 0} de alerta &nbsp;·&nbsp; 🔴 ${counts.red || 0} de precaución
      </div>

      <div class="block-title">🚀 SUGERENCIA DEL DÍA</div>
      <div class="reflection" style="border-left-color:var(--cyan); background:rgba(34,211,238,0.06); margin-bottom:20px;">
        <strong>${dailyTip}</strong>
      </div>

      <div class="block-title">🌱 REFLEXIONES DEL DÍA PARA TOMAR CONOCIMIENTO</div>
      ${reflectionsHtml}

      <div class="block-title">🍽️ ORIENTACIÓN NUTRICIONAL PARA HOY</div>
      <div class="reflection" style="margin-bottom:14px; border-left-color:var(--green-border);">
        ${nutritionObj.intro}
      </div>
      <div class="meal-grid">
        <div class="meal-card">
          <h4>🌅 Desayuno</h4>
          <p>${nutritionObj.meals.desayuno}</p>
        </div>
        <div class="meal-card">
          <h4>☀️ Almuerzo</h4>
          <p>${nutritionObj.meals.almuerzo}</p>
        </div>
        <div class="meal-card">
          <h4>☕ Merienda</h4>
          <p>${nutritionObj.meals.merienda}</p>
        </div>
        <div class="meal-card">
          <h4>🌙 Cena</h4>
          <p>${nutritionObj.meals.cena}</p>
        </div>
        
      </div>
      <div class="block-title">🍳 RECETARIO DE VIANDAS Y OPCIONES CASERAS</div>
      <p class="recipes-intro">Ideas simples para evitar ultraprocesados: viandas saladas y opciones dulces con ingredientes de casa.</p>
      <button type="button" class="download-btn" id="toggleRecipesBtn">Ver recetas</button>
      <div class="recipes-panel" id="recipesPanel" hidden>
        <div class="recipes-grid">
          ${buildRecipesHtml()}
        </div>
      </div>

      <div class="disclaimer-box recall-box">
        ⭐ <strong>Recordá:</strong> más allá del resultado de hoy, el equilibrio entre buen descanso, alimentación consciente, movimiento y tiempo de esparcimiento es la base de tu salud a largo plazo. Cada día cuenta, incluso los que no salen perfectos.
      </div>

      <div class="disclaimer-box warning-box">
        ⚠️ <strong>Importante:</strong> estas reflexiones y sugerencias son orientativas y no reemplazan una consulta profesional. Ante cualquier duda, malestar sostenido o condición de salud específica, consultá siempre con un nutricionista, médico o psicólogo.
      </div>
    `;

    resultsEl.classList.add('show');
    resultsEl.scrollIntoView({behavior:'smooth'});

    const toggleRecipesBtn = document.getElementById('toggleRecipesBtn');
        const recipesPanel = document.getElementById('recipesPanel');
        if(toggleRecipesBtn && recipesPanel){
          toggleRecipesBtn.addEventListener('click', ()=>{
            const isHidden = recipesPanel.hasAttribute('hidden');
            if(isHidden){
              recipesPanel.removeAttribute('hidden');
              toggleRecipesBtn.textContent = 'Ocultar recetas';
            } else {
              recipesPanel.setAttribute('hidden', '');
              toggleRecipesBtn.textContent = 'Ver recetas';
            }
          });
        }

    const now = new Date();
    const timeFormatted = now.toLocaleTimeString('es-AR', {hour: '2-digit', minute: '2-digit'});
    const dateFormatted = now.toLocaleDateString('es-AR', {weekday:'short', year:'numeric', month:'short', day:'numeric'}) + ' (' + timeFormatted + ' hs)';
    const timestamp = now.getTime();

    const hist = getHistory();
    const entryData = { timestamp, dateFormatted, selections, resultColor, dailyTip };

    hist.unshift(entryData);

    saveHistory(hist);
    renderHistory();
    showToast('¡Evaluación guardada exitosamente!', 'info');
  });

  clearHistoryBtn.addEventListener('click', ()=>{
    showConfirmModal(() => {
      saveHistory([]);
      try { localStorage.removeItem(STORAGE_KEY); } catch(e){}
      renderHistory();
      showToast('Historial borrado correctamente.', 'info');
    });
  });

  const COLOR_MAP = {
    green: 'Verde',
    yellow: 'Amarillo',
    red: 'Rojo',
    white: 'Blanco (No aplica / N/A)'
  };

  const RESULT_TEXT_MAP = {
    'VERDE': 'Verde',
    'AMARILLO': 'Amarillo',
    'ROJO': 'Rojo',
    'green': 'Verde',
    'yellow': 'Amarillo',
    'red': 'Rojo'
  };

  downloadHistoryBtn.addEventListener('click', ()=>{
    const hist = getHistory();
    if(hist.length === 0){
      showToast('No hay historial para descargar.', 'warning');
      return;
    }

    let csv = '\uFEFF"Fecha","Emociones","Actividad Física","Descanso","Trabajo","Estudio","Esparcimiento","Alimentación","Resultado Semáforo","Sugerencia del Día"\n';
    hist.forEach(h=>{
      const sel = h.selections || {};
      const em = COLOR_MAP[sel.emociones] || sel.emociones || '';
      const ac = COLOR_MAP[sel.actividad] || sel.actividad || '';
      const de = COLOR_MAP[sel.descanso] || sel.descanso || '';
      const tr = COLOR_MAP[sel.trabajo] || sel.trabajo || '';
      const es = COLOR_MAP[sel.estudio] || sel.estudio || '';
      const ep = COLOR_MAP[sel.esparcimiento] || sel.esparcimiento || '';
      const al = COLOR_MAP[sel.alimentacion] || sel.alimentacion || '';
      
      let resVal = (h.resultColor || '').toUpperCase();
      if(!resVal && sel){
        let counts = {green:0, yellow:0, red:0, white:0};
        Object.values(sel).forEach(v => { if(counts[v] !== undefined) counts[v]++; });
        if((counts.red >= 1 && counts.yellow >= 1) || counts.red >= 3) resVal = 'ROJO';
        else if(counts.red >= 1 || counts.yellow >= 1) resVal = 'AMARILLO';
        else resVal = 'VERDE';
      }
      let resFormatted = 'VERDE';
      if(resVal.includes('ROJO') || resVal === 'RED') resFormatted = 'ROJO';
      else if(resVal.includes('AMARILLO') || resVal === 'YELLOW') resFormatted = 'AMARILLO';

      const tipText = (h.dailyTip || buildDailyTip(sel)).replace(/"/g, '""');

      csv += `"${h.dateFormatted}","${em}","${ac}","${de}","${tr}","${es}","${ep}","${al}","${resFormatted}","${tipText}"\n`;
    });

    const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'semaforo_rutina_historial.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Descarga iniciada.', 'info');
  });

  renderHistory();

})();
