let numeroSerie = 0;
let intervaloCronometro = null;
let ultimoTimestamp = null;
let esMovil = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

// Detectar si es Chrome en Android (para fixes específicos)
const esChromeAndroid = /Chrome/.test(navigator.userAgent) && /Android/.test(navigator.userAgent);

// Vibrar en móviles (solo si está soportado)
function vibrar(duracion = 50) {
    if (esMovil && navigator.vibrate) {
        navigator.vibrate(duracion);
    }
}

// Actualizar disposición de elementos con mejor manejo de visibilidad
function actualizarDisposicionElementos() {
    const contenedorPrincipal = document.getElementById('contenedorPrincipal');
    const cronometroContainer = document.querySelector('.cronometro-container');
    const fechaContainer = document.getElementById('fechaContainer');
    const botonesFijos = document.getElementById('botonesFijos');
    const seriesGuardadas = JSON.parse(localStorage.getItem('seriesSentadillas') || '[]');
    
    const modoEntrenamientoIniciado = contenedorPrincipal.classList.contains('con-registros');

    if (modoEntrenamientoIniciado) {
        // Mostrar fecha y cronómetro
        fechaContainer.style.display = 'block';
        cronometroContainer.style.display = 'block';
        
        // Forzar reflow antes de la animación
        void cronometroContainer.offsetWidth;
        setTimeout(() => cronometroContainer.classList.add('mostrar'), 50);
        
        // Mostrar botones fijos con animación
        botonesFijos.style.display = 'flex';
        void botonesFijos.offsetWidth;
        setTimeout(() => {
            botonesFijos.classList.add('visible');
        }, 100);
        
        // Ajustar altura de la tabla si hay registros
        const tablaContainer = document.querySelector('.tabla-container');
        if (seriesGuardadas.length > 0) {
            tablaContainer.classList.add('con-registros');
        } else {
            tablaContainer.classList.remove('con-registros');
        }
        
        // Fix específico para Chrome Android
        if (esChromeAndroid) {
            setTimeout(() => {
                document.body.style.overflow = 'hidden';
                setTimeout(() => {
                    document.body.style.overflow = '';
                }, 100);
            }, 50);
        }
    } else {
        // Ocultar con animaciones
        cronometroContainer.classList.remove('mostrar');
        botonesFijos.classList.remove('visible');
        
        setTimeout(() => {
            cronometroContainer.style.display = 'none';
            fechaContainer.style.display = 'none';
            botonesFijos.style.display = 'none';
        }, 300);
        
        document.querySelector('.tabla-container').classList.remove('con-registros');
    }
}

// Obtener fecha formateada en español
function obtenerFechaFormateada(fecha) {
    const opciones = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    };
    return fecha.toLocaleDateString('es-ES', opciones);
}

// Formatear tiempo HH:MM:SS
function formatearTiempo(segundos) {
    const horas = Math.floor(segundos / 3600);
    const minutos = Math.floor((segundos % 3600) / 60);
    const segs = segundos % 60;
    return `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}:${segs.toString().padStart(2, '0')}`;
}

// Iniciar/actualizar cronómetro
function iniciarCronometro() {
    if (intervaloCronometro) {
        clearInterval(intervaloCronometro);
    }
    
    if (!ultimoTimestamp) return;
    
    // Actualizar inmediatamente
    const ahora = new Date().getTime();
    const segundosTranscurridos = Math.floor((ahora - ultimoTimestamp) / 1000);
    document.getElementById('cronometro').textContent = formatearTiempo(segundosTranscurridos);
    
    // Luego actualizar cada segundo
    intervaloCronometro = setInterval(() => {
        const ahora = new Date().getTime();
        const segundosTranscurridos = Math.floor((ahora - ultimoTimestamp) / 1000);
        document.getElementById('cronometro').textContent = formatearTiempo(segundosTranscurridos);
    }, 1000);
}

// Actualizar números de series después de eliminar
function actualizarNumerosSeries() {
    const filas = document.querySelectorAll('#tablaSeries tbody tr');
    let seriesActualizadas = [];
    let nuevoNumero = 1;
    
    filas.forEach(fila => {
        const celdaSerie = fila.cells[0];
        const contenidoDiv = celdaSerie.querySelector('.contenido-celda');
        const botonEliminar = contenidoDiv.querySelector('.boton-eliminar');
        const horaCelda = fila.cells[1];
        
        // Actualizar texto de la serie
        contenidoDiv.firstChild.textContent = `Serie ${nuevoNumero}`;
        botonEliminar.dataset.numeroActual = nuevoNumero;
        
        // Guardar datos actualizados
        seriesActualizadas.push({
            numero: nuevoNumero,
            hora: horaCelda.textContent,
            timestamp: parseInt(botonEliminar.dataset.timestamp)
        });
        
        nuevoNumero++;
    });
    
    // Actualizar localStorage
    localStorage.setItem('seriesSentadillas', JSON.stringify(seriesActualizadas));
    numeroSerie = seriesActualizadas.length;
    
    // Actualizar cronómetro si hay series
    if (seriesActualizadas.length > 0) {
        const primeraSerie = seriesActualizadas.reduce((min, s) => 
            s.timestamp < min.timestamp ? s : min, seriesActualizadas[0]);
        document.getElementById('fechaContainer').textContent = 
            obtenerFechaFormateada(new Date(primeraSerie.timestamp));
        
        const ultimaSerie = seriesActualizadas.reduce((max, s) => 
            s.timestamp > max.timestamp ? s : max, seriesActualizadas[0]);
        ultimoTimestamp = ultimaSerie.timestamp;
        
        iniciarCronometro();
    } else {
        // No hay series, resetear todo
        document.getElementById('fechaContainer').textContent = '';
        ultimoTimestamp = null;
        document.getElementById('cronometro').textContent = '00:00:00';
        
        if (intervaloCronometro) {
            clearInterval(intervaloCronometro);
            intervaloCronometro = null;
        }
        
        // Volver al estado inicial si no hay series
        document.getElementById('contenedorPrincipal').classList.remove('con-registros');
    }
    
    actualizarDisposicionElementos();
    vibrar(30); // Feedback táctil
}

// Registrar nueva serie
function registrarSerie() {
    vibrar(50); // Feedback al registrar
    
    const ahora = new Date();
    const horaFormateada = ahora.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    
    numeroSerie++;
    const timestamp = ahora.getTime();
    
    const tabla = document.getElementById('tablaSeries').getElementsByTagName('tbody')[0];
    const nuevaFila = tabla.insertRow();
    
    // Agregar clase de animación
    nuevaFila.style.animation = 'fadeIn 0.3s ease';
    
    const celdaSerie = nuevaFila.insertCell(0);
    const celdaHora = nuevaFila.insertCell(1);
    
    // Crear contenido de la celda de serie
    const contenidoSerie = document.createElement('div');
    contenidoSerie.className = 'contenido-celda';
    contenidoSerie.textContent = `Serie ${numeroSerie}`;
    
    // Botón eliminar
    const botonEliminar = document.createElement('button');
    botonEliminar.className = 'boton-eliminar';
    botonEliminar.textContent = '×';
    botonEliminar.dataset.numeroOriginal = numeroSerie;
    botonEliminar.dataset.numeroActual = numeroSerie;
    botonEliminar.dataset.timestamp = timestamp;
    botonEliminar.setAttribute('aria-label', `Eliminar serie ${numeroSerie}`);
    botonEliminar.setAttribute('title', 'Eliminar esta serie');
    
    botonEliminar.onclick = function () {
        vibrar(30);
        if (confirm('¿Estás seguro de que quieres eliminar esta serie?')) {
            nuevaFila.style.animation = 'fadeIn 0.3s ease reverse';
            setTimeout(() => {
                nuevaFila.remove();
                actualizarNumerosSeries();
            }, 300);
        }
    };
    
    contenidoSerie.appendChild(botonEliminar);
    celdaSerie.appendChild(contenidoSerie);
    celdaHora.textContent = horaFormateada;
    celdaHora.setAttribute('data-timestamp', timestamp);
    
    // Guardar en localStorage
    const series = JSON.parse(localStorage.getItem('seriesSentadillas') || '[]');
    series.push({ 
        numero: numeroSerie, 
        hora: horaFormateada, 
        timestamp: timestamp 
    });
    localStorage.setItem('seriesSentadillas', JSON.stringify(series));
    
    // Actualizar fecha si es la primera serie
    if (series.length === 1) {
        document.getElementById('fechaContainer').textContent = obtenerFechaFormateada(ahora);
    }
    
    // Actualizar cronómetro
    ultimoTimestamp = timestamp;
    iniciarCronometro();
    actualizarDisposicionElementos();
}

// Borrar todos los datos
function borrarDatos() {
    vibrar(100); // Feedback más largo para acción importante
    
    if (confirm('¿Estás seguro de que quieres borrar todas las series registradas?\n\nEsta acción no se puede deshacer.')) {
        const tablaBody = document.getElementById('tablaSeries').getElementsByTagName('tbody')[0];
        const filas = tablaBody.querySelectorAll('tr');
        
        // Animación de eliminación
        filas.forEach((fila, index) => {
            setTimeout(() => {
                fila.style.opacity = '0';
                fila.style.transform = 'translateX(-20px)';
            }, index * 50);
        });
        
        setTimeout(() => {
            // Limpiar todo
            tablaBody.innerHTML = '';
            numeroSerie = 0;
            document.getElementById('fechaContainer').textContent = '';
            localStorage.removeItem('seriesSentadillas');
            ultimoTimestamp = null;
            document.getElementById('cronometro').textContent = '00:00:00';
            
            if (intervaloCronometro) {
                clearInterval(intervaloCronometro);
                intervaloCronometro = null;
            }
            
            // Volver al estado inicial
            document.getElementById('contenedorPrincipal').classList.remove('con-registros');
            actualizarDisposicionElementos();
        }, filas.length * 50 + 300);
    }
}

// Iniciar entrenamiento (nueva sesión)
function iniciarEntrenamiento() {
    vibrar(50);
    
    // Limpiar datos anteriores
    document.getElementById('tablaSeries').getElementsByTagName('tbody')[0].innerHTML = '';
    numeroSerie = 0;
    localStorage.removeItem('seriesSentadillas');
    ultimoTimestamp = null;
    document.getElementById('cronometro').textContent = '00:00:00';
    
    if (intervaloCronometro) {
        clearInterval(intervaloCronometro);
        intervaloCronometro = null;
    }
    
    // Cambiar a modo entrenamiento
    document.getElementById('contenedorPrincipal').classList.add('con-registros');
    const ahora = new Date();
    document.getElementById('fechaContainer').textContent = obtenerFechaFormateada(ahora);
    
    actualizarDisposicionElementos();
}

// Cargar datos al iniciar
window.onload = function () {
    const seriesGuardadas = JSON.parse(localStorage.getItem('seriesSentadillas') || '[]');
    
    if (seriesGuardadas.length > 0) {
        document.getElementById('contenedorPrincipal').classList.add('con-registros');
        const tabla = document.getElementById('tablaSeries').getElementsByTagName('tbody')[0];
        
        // Ordenar por timestamp
        seriesGuardadas.sort((a, b) => a.timestamp - b.timestamp);
        
        // Reconstruir tabla
        seriesGuardadas.forEach(serie => {
            const nuevaFila = tabla.insertRow();
            const celdaSerie = nuevaFila.insertCell(0);
            const celdaHora = nuevaFila.insertCell(1);
            
            const contenidoSerie = document.createElement('div');
            contenidoSerie.className = 'contenido-celda';
            contenidoSerie.textContent = `Serie ${serie.numero}`;
            
            const botonEliminar = document.createElement('button');
            botonEliminar.className = 'boton-eliminar';
            botonEliminar.textContent = '×';
            botonEliminar.dataset.numeroOriginal = serie.numero;
            botonEliminar.dataset.numeroActual = serie.numero;
            botonEliminar.dataset.timestamp = serie.timestamp;
            botonEliminar.setAttribute('aria-label', `Eliminar serie ${serie.numero}`);
            
            botonEliminar.onclick = function () {
                vibrar(30);
                if (confirm('¿Estás seguro de que quieres eliminar esta serie?')) {
                    nuevaFila.style.animation = 'fadeIn 0.3s ease reverse';
                    setTimeout(() => {
                        nuevaFila.remove();
                        actualizarNumerosSeries();
                    }, 300);
                }
            };
            
            contenidoSerie.appendChild(botonEliminar);
            celdaSerie.appendChild(contenidoSerie);
            celdaHora.textContent = serie.hora;
            celdaHora.setAttribute('data-timestamp', serie.timestamp);
            
            numeroSerie = Math.max(numeroSerie, serie.numero);
        });
        
        // Configurar fecha y cronómetro
        const primeraSerie = seriesGuardadas[0];
        document.getElementById('fechaContainer').textContent = 
            obtenerFechaFormateada(new Date(primeraSerie.timestamp));
        
        const ultimaSerie = seriesGuardadas[seriesGuardadas.length - 1];
        ultimoTimestamp = ultimaSerie.timestamp;
        iniciarCronometro();
        
        // Mostrar cronómetro con animación
        setTimeout(() => {
            document.querySelector('.cronometro-container').classList.add('mostrar');
        }, 500);
    }
    
    // Configurar botones
    const botonComenzar = document.getElementById('botonComenzar');
    const botonRegistrar = document.getElementById('botonRegistrar');
    const botonBorrar = document.getElementById('botonBorrar');
    
    if (botonComenzar) {
        botonComenzar.addEventListener('click', iniciarEntrenamiento);
        botonComenzar.addEventListener('touchstart', () => vibrar(30));
    }
    
    if (botonRegistrar) {
        botonRegistrar.addEventListener('click', registrarSerie);
        botonRegistrar.addEventListener('touchstart', () => vibrar(30));
    }
    
    if (botonBorrar) {
        botonBorrar.addEventListener('click', borrarDatos);
        botonBorrar.addEventListener('touchstart', () => vibrar(30));
    }
    
    // Inicializar disposición
    actualizarDisposicionElementos();
    
    // Prevenir zoom con doble toque en móviles
    if (esMovil) {
        document.addEventListener('touchstart', function(event) {
            if (event.touches.length > 1) {
                event.preventDefault();
            }
        }, { passive: false });
        
        let lastTouchEnd = 0;
        document.addEventListener('touchend', function(event) {
            const now = Date.now();
            if (now - lastTouchEnd <= 300) {
                event.preventDefault();
            }
            lastTouchEnd = now;
        }, false);
    }
    
    // Manejar cambios de orientación
    window.addEventListener('orientationchange', function() {
        setTimeout(() => {
            actualizarDisposicionElementos();
        }, 300);
    });
    
    // Actualizar cada minuto por si hay cambios de hora
    setInterval(() => {
        if (ultimoTimestamp) {
            iniciarCronometro();
        }
    }, 60000);
};

// Exportar funciones para uso global
window.registrarSerie = registrarSerie;
window.borrarDatos = borrarDatos;
