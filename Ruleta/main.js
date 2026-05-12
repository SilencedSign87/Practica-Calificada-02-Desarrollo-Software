const ruelta = new Roulette()
const areaTextoElementos = document.getElementById('entrada-lista');
const visorRespuesta = document.getElementById('texto-seleccionado');
const botonIniciar = document.getElementById('btn-iniciar');
const botonReiniciar = document.getElementById('btn-reiniciar-top');

function guardarDatos() {
    localStorage.setItem('DatosRuelta', areaTextoElementos.value);
}

function cargarDatos() {
    const datos = localStorage.getItem('DatosRuelta');
    if (datos) {
        areaTextoElementos.value = datos;
    }
}

function actualizarRenderRuleta() {
    const texto = areaTextoElementos.value;
    const items = texto.split('\n').map(linea => linea.trim()).filter(linea => linea !== '');
    ruelta.RenderOptions(items);
}

function iniciarGiroRuleta() {
    ruelta.start((winner) => {
        visorRespuesta.textContent = winner;
    });
}

function ocultarElementoSeleccionado() {
    // Por implementar
}

function reiniciarSorteo() {
    ruelta.rotation = 0;
    ruelta.draw();
}

areaTextoElementos.addEventListener('input', () => {
    guardarDatos();
    actualizarRenderRuleta();
});

botonIniciar.addEventListener('click', iniciarGiroRuleta);
botonReiniciar.addEventListener('click', reiniciarSorteo);

document.addEventListener('keydown', (evento) => {
    const tecla = evento.key;

    if (document.activeElement === areaTextoElementos && tecla !== 'Escape') return;

    switch (tecla) {
        case ' ':
            evento.preventDefault();
            iniciarGiroRuleta();
            break;
        case 's':
        case 'S':
            ocultarElementoSeleccionado();
            break;
        case 'r':
        case 'R':
            reiniciarSorteo();
            break;
        case 'e':
        case 'E':
            areaTextoElementos.focus();
            break;
        case 'f':
        case 'F':
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen();
            } else {
                document.exitFullscreen();
            }
            break;
    }
});

window.addEventListener('DOMContentLoaded', () => {
    cargarDatos();

    if (areaTextoElementos.value.trim()) {
        actualizarRenderRuleta();
    }
});
